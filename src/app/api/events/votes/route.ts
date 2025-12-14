import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { candidate_id } = body

    if (!candidate_id) {
      return NextResponse.json({ error: 'Missing candidate_id' }, { status: 400 })
    }

    // Get candidate to verify it exists and get round_id
    const { data: candidate, error: candidateError } = await supabase
      .from('weekly_game_candidates')
      .select('*, round_id')
      .eq('id', candidate_id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Check if round is still open
    const { data: round } = await supabase
      .from('weekly_rounds')
      .select('status')
      .eq('id', candidate.round_id)
      .single()

    if (round?.status !== 'open') {
      return NextResponse.json({ error: 'Voting is closed for this round' }, { status: 400 })
    }

    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from('weekly_game_votes')
      .select('id')
      .eq('round_id', candidate.round_id)
      .eq('candidate_id', candidate_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted for this candidate' }, { status: 400 })
    }

    // Insert vote (use default values for time_pref and day_pref - will be set later when game is chosen)
    // Using 'afternoon' as default time_pref to satisfy NOT NULL constraint
    const { data: vote, error: voteError } = await supabase
      .from('weekly_game_votes')
      .insert({
        round_id: candidate.round_id,
        candidate_id,
        user_id: user.id,
        time_pref: 'afternoon', // Default value, will be updated later
        day_pref: null, // Can be null
      })
      .select()
      .single()

    if (voteError) {
      console.error('Error creating/updating vote:', voteError)
      return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
    }

    // Update last_active_at
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ vote })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { candidate_id } = body

    if (!candidate_id) {
      return NextResponse.json({ error: 'Missing candidate_id' }, { status: 400 })
    }

    // Get candidate to verify it exists and get round_id
    const { data: candidate, error: candidateError } = await supabase
      .from('weekly_game_candidates')
      .select('round_id')
      .eq('id', candidate_id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Check if round is still open
    const { data: round } = await supabase
      .from('weekly_rounds')
      .select('status')
      .eq('id', candidate.round_id)
      .single()

    if (round?.status !== 'open') {
      return NextResponse.json({ error: 'Voting is closed for this round' }, { status: 400 })
    }

    // Delete the vote
    const { error: deleteError } = await supabase
      .from('weekly_game_votes')
      .delete()
      .eq('round_id', candidate.round_id)
      .eq('candidate_id', candidate_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting vote:', deleteError)
      return NextResponse.json({ error: 'Failed to delete vote' }, { status: 500 })
    }

    // Update last_active_at
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


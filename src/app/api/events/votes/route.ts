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
    const { candidate_id, time_pref } = body

    if (!candidate_id || !time_pref) {
      return NextResponse.json({ error: 'Missing candidate_id or time_pref' }, { status: 400 })
    }

    const validTimePrefs = ['morning', 'noon', 'afternoon', 'evening', 'late_night']
    if (!validTimePrefs.includes(time_pref)) {
      return NextResponse.json({ error: 'Invalid time_pref' }, { status: 400 })
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

    // Upsert vote (insert or update if exists)
    const { data: vote, error: voteError } = await supabase
      .from('weekly_game_votes')
      .upsert(
        {
          round_id: candidate.round_id,
          candidate_id,
          user_id: user.id,
          time_pref,
        },
        {
          onConflict: 'round_id,user_id,candidate_id',
        }
      )
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


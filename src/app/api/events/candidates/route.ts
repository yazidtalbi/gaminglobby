import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current active round
    const { data: currentRound } = await supabase
      .from('weekly_rounds')
      .select('*')
      .or('status.eq.open,status.eq.locked')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!currentRound) {
      return NextResponse.json({ candidates: [] })
    }

    // Get candidates with vote distribution
    const { data: candidates, error } = await supabase
      .from('weekly_game_candidates')
      .select('*')
      .eq('round_id', currentRound.id)
      .order('total_votes', { ascending: false })

    if (error) {
      console.error('Error fetching candidates:', error)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    // Get time preference distribution for each candidate and recalculate total_votes
    const candidatesWithDistribution = await Promise.all(
      (candidates || []).map(async (candidate) => {
        const { data: votes } = await supabase
          .from('weekly_game_votes')
          .select('time_pref')
          .eq('candidate_id', candidate.id)

        const distribution = {
          morning: 0,
          noon: 0,
          afternoon: 0,
          evening: 0,
          late_night: 0,
        }

        votes?.forEach((vote) => {
          distribution[vote.time_pref as keyof typeof distribution]++
        })

        // Recalculate total_votes from actual vote count
        const actualVoteCount = votes?.length || 0

        return {
          ...candidate,
          total_votes: actualVoteCount, // Use actual count instead of database value
          timeDistribution: distribution,
        }
      })
    )

    return NextResponse.json({ candidates: candidatesWithDistribution })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { game_id, game_name } = body

    if (!game_id || !game_name) {
      return NextResponse.json({ error: 'Missing game_id or game_name' }, { status: 400 })
    }

    // Get current active round
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError || !currentRound) {
      return NextResponse.json({ error: 'No active voting round' }, { status: 400 })
    }

    // Check if candidate already exists
    const { data: existingCandidate } = await supabase
      .from('weekly_game_candidates')
      .select('*')
      .eq('round_id', currentRound.id)
      .eq('game_id', game_id)
      .single()

    if (existingCandidate) {
      return NextResponse.json({ candidate: existingCandidate })
    }

    // Create new candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('weekly_game_candidates')
      .insert({
        round_id: currentRound.id,
        game_id,
        game_name,
        created_by: user.id,
      })
      .select()
      .single()

    if (candidateError) {
      console.error('Error creating candidate:', candidateError)
      return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
    }

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


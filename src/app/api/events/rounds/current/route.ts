import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current active round (status = 'open' or most recent 'locked'/'processed')
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .or('status.eq.open,status.eq.locked')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError && roundError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      console.error('Error fetching current round:', roundError)
      return NextResponse.json({ error: 'Failed to fetch current round' }, { status: 500 })
    }

    if (!currentRound) {
      return NextResponse.json({ round: null, candidates: [], userVotes: [] })
    }

    // Get candidates for this round
    const { data: candidates, error: candidatesError } = await supabase
      .from('weekly_game_candidates')
      .select('*')
      .eq('round_id', currentRound.id)

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    // Recalculate total_votes from actual votes for accuracy
    const candidatesWithAccurateCounts = await Promise.all(
      (candidates || []).map(async (candidate) => {
        const { count } = await supabase
          .from('weekly_game_votes')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', candidate.id)

        return {
          ...candidate,
          total_votes: count || 0,
        }
      })
    )

    // Sort by total_votes after recalculating
    const sortedCandidates = candidatesWithAccurateCounts.sort(
      (a, b) => b.total_votes - a.total_votes
    )

    // Get user votes if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    let userVotes: any[] = []

    if (user) {
      const { data: votes, error: votesError } = await supabase
        .from('weekly_game_votes')
        .select('*')
        .eq('round_id', currentRound.id)
        .eq('user_id', user.id)

      if (!votesError && votes) {
        userVotes = votes
      }
    }

    return NextResponse.json({
      round: currentRound,
      candidates: sortedCandidates || [],
      userVotes: userVotes,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Lightweight endpoint for home page hero section
 * Only returns essential voting data: round, candidates, and user votes
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current active round (only 'open' rounds)
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('id, week_key, status, voting_ends_at, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError && roundError.code !== 'PGRST116') {
      console.error('Error fetching current round:', roundError)
      return NextResponse.json({ error: 'Failed to fetch current round' }, { status: 500 })
    }

    if (!currentRound) {
      return NextResponse.json({ round: null, candidates: [], userVotes: {} })
    }

    // Get candidates for this round (only essential fields)
    const { data: candidates, error: candidatesError } = await supabase
      .from('weekly_game_candidates')
      .select('id, game_id, game_name, created_at')
      .eq('round_id', currentRound.id)

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    // Get vote counts for each candidate (single query with aggregation)
    const candidateIds = (candidates || []).map(c => c.id)
    let voteCounts: Record<string, number> = {}

    if (candidateIds.length > 0) {
      const { data: votes } = await supabase
        .from('weekly_game_votes')
        .select('candidate_id')
        .in('candidate_id', candidateIds)

      // Count votes per candidate
      votes?.forEach(vote => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1
      })
    }

    // Attach vote counts to candidates and filter/sort
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const candidatesWithVotes = (candidates || [])
      .map(candidate => ({
        ...candidate,
        total_votes: voteCounts[candidate.id] || 0,
      }))
      .filter(candidate => {
        // Keep if has votes OR was created recently (within last 5 minutes)
        return candidate.total_votes > 0 || new Date(candidate.created_at) > new Date(fiveMinutesAgo)
      })
      .sort((a, b) => b.total_votes - a.total_votes)
      .slice(0, 5) // Limit to top 5 for home page

    // Get user votes if authenticated (simple boolean map)
    const { data: { user } } = await supabase.auth.getUser()
    const userVotes: Record<string, boolean> = {}

    if (user && candidateIds.length > 0) {
      const { data: votes } = await supabase
        .from('weekly_game_votes')
        .select('candidate_id')
        .eq('round_id', currentRound.id)
        .eq('user_id', user.id)
        .in('candidate_id', candidateIds)

      votes?.forEach(vote => {
        userVotes[vote.candidate_id] = true
      })
    }

    return NextResponse.json({
      round: currentRound,
      candidates: candidatesWithVotes,
      userVotes,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

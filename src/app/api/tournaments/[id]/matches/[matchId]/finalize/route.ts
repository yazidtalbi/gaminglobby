import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { finalizeMatchSchema } from '@/lib/tournaments/validation'
import { getNextMatch, isTournamentComplete, getFinalPlacements } from '@/lib/tournaments/bracket'
import { grantTournamentRewards } from '@/lib/tournaments/rewards'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/matches/[matchId]/finalize - Finalize match result (host only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const tournamentId = params.id
    const matchId = params.matchId

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if user is host
    if (tournament.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only tournament host can finalize matches' },
        { status: 403 }
      )
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .eq('tournament_id', tournamentId)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if already finalized
    if (match.status === 'completed') {
      return NextResponse.json(
        { error: 'Match already finalized' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = finalizeMatchSchema.parse(body)

    // Verify winner is one of the participants
    if (validated.winner_id !== match.participant1_id && validated.winner_id !== match.participant2_id) {
      return NextResponse.json(
        { error: 'Winner must be one of the match participants' },
        { status: 400 }
      )
    }

    // Finalize match
    const { error: finalizeError } = await supabase
      .from('tournament_matches')
      .update({
        winner_id: validated.winner_id,
        score1: validated.score1,
        score2: validated.score2,
        outcome_method: validated.outcome_method,
        outcome_notes: validated.outcome_notes || null,
        status: 'completed',
        finalized_by: user.id,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (finalizeError) {
      console.error('Error finalizing match:', finalizeError)
      return NextResponse.json(
        { error: 'Failed to finalize match' },
        { status: 500 }
      )
    }

    // Get all matches to rebuild bracket
    const { data: allMatches } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        participant1:tournament_participants!tournament_matches_participant1_id_fkey(*),
        participant2:tournament_participants!tournament_matches_participant2_id_fkey(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })

    // Rebuild bracket structure
    const rounds = new Map<number, typeof allMatches>()
    allMatches?.forEach(m => {
      if (!rounds.has(m.round_number)) {
        rounds.set(m.round_number, [])
      }
      rounds.get(m.round_number)!.push(m)
    })

    const bracket = {
      rounds: Array.from(rounds.entries()).map(([roundNumber, matches]) => ({
        roundNumber,
        matches: (matches || []).sort((a, b) => a.match_number - b.match_number),
      })),
    }

    // Advance winner to next round
    const completedMatch = allMatches?.find(m => m.id === matchId)
    if (completedMatch && completedMatch.round_number < bracket.rounds.length) {
      const nextRound = bracket.rounds.find(r => r.roundNumber === completedMatch.round_number + 1)
      if (nextRound) {
        const matchIndex = bracket.rounds[completedMatch.round_number - 1].matches.findIndex(
          m => m.match_number === completedMatch.match_number
        )
        const nextMatchNumber = Math.floor(matchIndex / 2) + 1
        const nextMatch = nextRound.matches.find(m => m.match_number === nextMatchNumber)

        if (nextMatch) {
          // Determine which slot (participant1 or participant2)
          const isFirstSlot = matchIndex % 2 === 0

          await supabase
            .from('tournament_matches')
            .update({
              [isFirstSlot ? 'participant1_id' : 'participant2_id']: validated.winner_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', nextMatch.id)
        }
      }
    }

    // Check if tournament is complete
    const isComplete = isTournamentComplete(bracket)
    if (isComplete) {
      // Get final placements
      const placements = getFinalPlacements(bracket)

      // Update participant final placements
      if (placements.first) {
        await supabase
          .from('tournament_participants')
          .update({ final_placement: 1 })
          .eq('id', placements.first)
      }
      if (placements.second) {
        await supabase
          .from('tournament_participants')
          .update({ final_placement: 2 })
          .eq('id', placements.second)
      }
      if (placements.third) {
        await supabase
          .from('tournament_participants')
          .update({ final_placement: 3 })
          .eq('id', placements.third)
      }
      if (placements.fourth) {
        for (const participantId of placements.fourth) {
          await supabase
            .from('tournament_participants')
            .update({ final_placement: 4 })
            .eq('id', participantId)
        }
      }

      // Grant rewards
      await grantTournamentRewards(tournamentId, placements)

      // Update tournament status
      await supabase
        .from('tournaments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tournamentId)
    }

    return NextResponse.json({
      message: 'Match finalized successfully',
      tournament_complete: isComplete,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

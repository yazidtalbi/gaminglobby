// Bracket generation for single elimination tournaments

import { TournamentParticipant, TournamentMatch, Bracket } from '@/types/tournaments'

/**
 * Generate single elimination bracket for 8 or 16 participants
 * Creates all rounds and matches upfront
 */
export function generateSingleEliminationBracket(
  participants: TournamentParticipant[],
  tournamentId: string
): Bracket {
  const participantCount = participants.length
  const maxParticipants = participantCount === 8 ? 8 : 16

  if (participantCount !== 8 && participantCount !== 16) {
    throw new Error(`Invalid participant count: ${participantCount}. Must be 8 or 16.`)
  }

  // Calculate number of rounds
  const rounds = Math.log2(maxParticipants)
  const bracket: Bracket = { rounds: [] }

  // First round: all participants
  const firstRoundMatches: TournamentMatch[] = []
  for (let i = 0; i < participantCount; i += 2) {
    const matchNumber = Math.floor(i / 2) + 1
    firstRoundMatches.push({
      id: '', // Will be set by database
      tournament_id: tournamentId,
      round_number: 1,
      match_number: matchNumber,
      participant1_id: participants[i].id,
      participant2_id: participants[i + 1]?.id || null,
      winner_id: null,
      status: 'pending',
      lobby_id: null,
      score1: 0,
      score2: 0,
      outcome_method: 'manual',
      outcome_notes: null,
      finalized_by: null,
      finalized_at: null,
      created_at: '',
      updated_at: '',
    })
  }

  bracket.rounds.push({ roundNumber: 1, matches: firstRoundMatches })

  // Subsequent rounds: winners advance
  for (let round = 2; round <= rounds; round++) {
    const previousRound = bracket.rounds[round - 2]
    const currentRoundMatches: TournamentMatch[] = []

    // Each match in current round depends on 2 matches from previous round
    for (let i = 0; i < previousRound.matches.length; i += 2) {
      const matchNumber = Math.floor(i / 2) + 1
      currentRoundMatches.push({
        id: '',
        tournament_id: tournamentId,
        round_number: round,
        match_number: matchNumber,
        participant1_id: null, // Will be set when previous match completes
        participant2_id: null,
        winner_id: null,
        status: 'pending',
        lobby_id: null,
        score1: 0,
        score2: 0,
        outcome_method: 'manual',
        outcome_notes: null,
        finalized_by: null,
        finalized_at: null,
        created_at: '',
        updated_at: '',
      })
    }

    bracket.rounds.push({ roundNumber: round, matches: currentRoundMatches })
  }

  return bracket
}

/**
 * Advance winner to next round after match completion
 */
export function getNextMatch(
  bracket: Bracket,
  completedMatch: TournamentMatch
): TournamentMatch | null {
  const currentRound = bracket.rounds.find(r => r.roundNumber === completedMatch.round_number)
  if (!currentRound) return null

  const matchIndex = currentRound.matches.findIndex(m => m.match_number === completedMatch.match_number)
  if (matchIndex === -1) return null

  // Check if there's a next round
  const nextRoundNumber = completedMatch.round_number + 1
  const nextRound = bracket.rounds.find(r => r.roundNumber === nextRoundNumber)
  if (!nextRound) return null // Tournament complete

  // Determine which match in next round this winner goes to
  const nextMatchNumber = Math.floor(matchIndex / 2) + 1
  const nextMatch = nextRound.matches.find(m => m.match_number === nextMatchNumber)
  
  return nextMatch || null
}

/**
 * Check if tournament is complete (final match has winner)
 */
export function isTournamentComplete(bracket: Bracket): boolean {
  const finalRound = bracket.rounds[bracket.rounds.length - 1]
  if (!finalRound || finalRound.matches.length !== 1) return false

  const finalMatch = finalRound.matches[0]
  return finalMatch.status === 'completed' && finalMatch.winner_id !== null
}

/**
 * Get final placements (1st, 2nd, 3rd, 4th)
 */
export function getFinalPlacements(bracket: Bracket): {
  first: string | null
  second: string | null
  third: string | null
  fourth: string[] | null
} {
  const finalRound = bracket.rounds[bracket.rounds.length - 1]
  const semifinalRound = bracket.rounds[bracket.rounds.length - 2]

  const first = finalRound?.matches[0]?.winner_id || null
  const second = finalRound?.matches[0]?.participant1_id === first
    ? finalRound.matches[0].participant2_id
    : finalRound?.matches[0]?.participant1_id || null

  // Third place: loser of semifinal that didn't make final
  // Fourth place: losers of both semifinals
  let third: string | null = null
  const fourth: string[] = []

  if (semifinalRound) {
    for (const match of semifinalRound.matches) {
      if (match.status === 'completed' && match.winner_id) {
        const loser = match.participant1_id === match.winner_id
          ? match.participant2_id
          : match.participant1_id
        
        if (loser && loser !== second) {
          third = loser
        }
        if (loser) {
          fourth.push(loser)
        }
      }
    }
  }

  return { first, second, third, fourth: fourth.length > 0 ? fourth : null }
}

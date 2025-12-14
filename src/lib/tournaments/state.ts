// Tournament state logic
import { Tournament } from '@/types/tournaments'

export type TournamentState = 'upcoming' | 'live' | 'completed'

/**
 * Determine tournament state from tournament fields
 * 
 * Rules:
 * - upcoming: now < start_date AND status in ('open', 'draft')
 * - live: between start_date and end_date OR status in ('in_progress', 'registration_closed')
 * - completed: status === 'completed' OR end_date < now
 */
export function getTournamentState(tournament: Tournament): TournamentState {
  const now = new Date()
  const startDate = new Date(tournament.start_at)
  
  // Completed: status is 'completed' or 'cancelled'
  if (tournament.status === 'completed' || tournament.status === 'cancelled') {
    return 'completed'
  }

  // Live: status is 'in_progress' or 'registration_closed', OR we're past start date
  if (
    tournament.status === 'in_progress' ||
    tournament.status === 'registration_closed' ||
    now >= startDate
  ) {
    return 'live'
  }

  // Upcoming: now < start_date AND status is 'open' or 'draft'
  if (now < startDate && (tournament.status === 'open' || tournament.status === 'draft')) {
    return 'upcoming'
  }

  // Default fallback
  return 'upcoming'
}

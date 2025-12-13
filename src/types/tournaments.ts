// Tournament Types

export type TournamentStatus = 'draft' | 'open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled'
export type ParticipantStatus = 'registered' | 'checked_in' | 'withdrawn' | 'disqualified'
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'forfeited'
export type OutcomeMethod = 'manual' | 'forfeit' | 'timeout' | 'disconnect'
export type ReportStatus = 'submitted' | 'withdrawn' | 'accepted' | 'rejected'
export type RewardType = 'badge' | 'pro_days' | 'visibility'

export interface Tournament {
  id: string
  host_id: string
  game_id: string
  game_name: string
  title: string
  description: string | null
  cover_url: string | null
  status: TournamentStatus
  max_participants: 8 | 16
  current_participants: number
  platform: string
  start_at: string
  registration_deadline: string
  check_in_required: boolean
  check_in_deadline: string
  rules: string | null
  discord_link: string | null
  badge_1st_label: string | null
  badge_1st_image_url: string | null
  badge_2nd_label: string | null
  badge_2nd_image_url: string | null
  badge_3rd_label: string | null
  badge_3rd_image_url: string | null
  created_at: string
  updated_at: string
}

export interface TournamentWithHost extends Tournament {
  host: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface TournamentParticipant {
  id: string
  tournament_id: string
  user_id: string
  seed: number | null
  status: ParticipantStatus
  checked_in_at: string | null
  final_placement: number | null
  created_at: string
  profile?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface TournamentMatch {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  participant1_id: string | null
  participant2_id: string | null
  winner_id: string | null
  status: MatchStatus
  lobby_id: string | null
  score1: number
  score2: number
  outcome_method: OutcomeMethod
  outcome_notes: string | null
  finalized_by: string | null
  finalized_at: string | null
  created_at: string
  updated_at: string
  participant1?: TournamentParticipant
  participant2?: TournamentParticipant
  winner?: TournamentParticipant
}

export interface TournamentMatchReport {
  id: string
  tournament_id: string
  match_id: string
  reporter_participant_id: string
  reporter_user_id: string
  claimed_winner_participant_id: string | null
  claimed_score1: number | null
  claimed_score2: number | null
  claimed_method: string
  notes: string | null
  proof_paths: string[]
  status: ReportStatus
  created_at: string
}

export interface TournamentReward {
  id: string
  tournament_id: string
  user_id: string
  reward_type: RewardType
  payload: Record<string, unknown>
  created_at: string
}

export interface ProfileBadge {
  id: string
  user_id: string
  badge_key: string
  label: string
  game_id: string | null
  tournament_id: string | null
  created_at: string
}

export interface BracketRound {
  roundNumber: number
  matches: TournamentMatch[]
}

export interface Bracket {
  rounds: BracketRound[]
}

// API Request/Response types

export interface CreateTournamentInput {
  game_id: string
  game_name: string
  title: string
  description?: string
  cover_url?: string
  max_participants: 8 | 16
  platform: string
  start_at: string
  registration_deadline: string
  check_in_required: boolean
  check_in_deadline: string
  rules?: string
  discord_link?: string
  badge_1st_label?: string
  badge_1st_image_url?: string
  badge_2nd_label?: string
  badge_2nd_image_url?: string
  badge_3rd_label?: string
  badge_3rd_image_url?: string
}

export interface FinalizeMatchInput {
  winner_id: string
  score1: number
  score2: number
  outcome_method: OutcomeMethod
  outcome_notes?: string
}

export interface SubmitMatchReportInput {
  claimed_winner_participant_id: string
  claimed_score1: number
  claimed_score2: number
  claimed_method?: string
  notes?: string
  proof_paths: string[]
}

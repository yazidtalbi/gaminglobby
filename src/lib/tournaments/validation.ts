// Tournament validation schemas using Zod

import { z } from 'zod'

export const createTournamentSchema = z.object({
  game_id: z.string().min(1),
  game_name: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  cover_url: z.string().url().optional().nullable(),
  max_participants: z.literal(8).or(z.literal(16)),
  platform: z.string().min(1),
  start_at: z.string().datetime(),
  registration_deadline: z.string().datetime(),
  check_in_required: z.boolean(),
  check_in_deadline: z.string().datetime(),
  rules: z.string().max(2000).optional(),
  discord_link: z.string().url().optional().nullable(),
})

export const finalizeMatchSchema = z.object({
  winner_id: z.string().uuid(),
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
  outcome_method: z.enum(['manual', 'forfeit', 'timeout', 'disconnect']),
  outcome_notes: z.string().max(500).optional(),
})

export const submitMatchReportSchema = z.object({
  claimed_winner_participant_id: z.string().uuid(),
  claimed_score1: z.number().int().min(0),
  claimed_score2: z.number().int().min(0),
  claimed_method: z.string().optional(),
  notes: z.string().max(500).optional(),
  proof_paths: z.array(z.string()).min(1).max(5),
})

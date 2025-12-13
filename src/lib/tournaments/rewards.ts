// Tournament reward granting logic

import { createClient } from '@/lib/supabase/server'
import { TournamentReward, ProfileBadge } from '@/types/tournaments'

const BADGE_CONFIG = {
  tournament_winner: {
    label: 'Tournament Winner',
    pro_days: 7,
    visibility_days: 7,
  },
  tournament_finalist: {
    label: 'Tournament Finalist',
    pro_days: 3,
    visibility_days: 0,
  },
  tournament_top4: {
    label: 'Top 4',
    pro_days: 0,
    visibility_days: 0,
  },
} as const

/**
 * Grant rewards based on final placement
 */
export async function grantTournamentRewards(
  tournamentId: string,
  placements: {
    first: string | null
    second: string | null
    third: string | null
    fourth: string[] | null
  }
): Promise<void> {
  const supabase = createClient()

  // Grant 1st place rewards
  if (placements.first) {
    await grantReward(tournamentId, placements.first, 'tournament_winner')
  }

  // Grant 2nd place rewards
  if (placements.second) {
    await grantReward(tournamentId, placements.second, 'tournament_finalist')
  }

  // Grant 3rd place rewards (if exists)
  if (placements.third) {
    await grantReward(tournamentId, placements.third, 'tournament_finalist')
  }

  // Grant Top 4 badges
  if (placements.fourth) {
    for (const userId of placements.fourth) {
      await grantReward(tournamentId, userId, 'tournament_top4')
    }
  }
}

/**
 * Grant individual reward (badge, pro days, visibility)
 */
async function grantReward(
  tournamentId: string,
  userId: string,
  badgeKey: keyof typeof BADGE_CONFIG
): Promise<void> {
  const supabase = createClient()
  const config = BADGE_CONFIG[badgeKey]

  // Grant badge
  const { error: badgeError } = await supabase
    .from('profile_badges')
    .insert({
      user_id: userId,
      badge_key: badgeKey,
      label: config.label,
      tournament_id: tournamentId,
    })
    .select()
    .single()

  if (badgeError && badgeError.code !== '23505') { // Ignore duplicate key errors
    console.error('Error granting badge:', badgeError)
  }

  // Grant Pro days
  if (config.pro_days > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier, plan_expires_at')
      .eq('id', userId)
      .single()

    if (profile) {
      const currentExpiry = profile.plan_expires_at
        ? new Date(profile.plan_expires_at)
        : new Date()
      
      const newExpiry = new Date(currentExpiry)
      newExpiry.setDate(newExpiry.getDate() + config.pro_days)

      // Only extend if user doesn't have longer Pro already
      if (!profile.plan_expires_at || newExpiry > new Date(profile.plan_expires_at)) {
        await supabase
          .from('profiles')
          .update({
            plan_tier: 'pro',
            plan_expires_at: newExpiry.toISOString(),
          })
          .eq('id', userId)

        // Record reward
        await supabase
          .from('tournament_rewards')
          .insert({
            tournament_id: tournamentId,
            user_id: userId,
            reward_type: 'pro_days',
            payload: { days: config.pro_days, expires_at: newExpiry.toISOString() },
          })
      }
    }
  }

  // Grant visibility boost (featured winner)
  if (config.visibility_days > 0) {
    await supabase
      .from('tournament_rewards')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        reward_type: 'visibility',
        payload: { days: config.visibility_days },
      })
  }
}

/**
 * Get user's tournament badges
 */
export async function getUserTournamentBadges(userId: string): Promise<ProfileBadge[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profile_badges')
    .select('*')
    .eq('user_id', userId)
    .in('badge_key', ['tournament_winner', 'tournament_finalist', 'tournament_top4'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }

  return data || []
}

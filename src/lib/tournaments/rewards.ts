// Tournament reward granting logic

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileBadge, Tournament } from '@/types/tournaments'

const DEFAULT_BADGE_CONFIG = {
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
  const supabase = await createServerSupabaseClient()

  // Get tournament to check for custom badges
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single()

  if (!tournament) {
    console.error('Tournament not found:', tournamentId)
    return
  }

  // Grant 1st place rewards
  if (placements.first) {
    await grantReward(
      tournamentId,
      placements.first,
      'tournament_winner',
      tournament as Tournament
    )
  }

  // Grant 2nd place rewards
  if (placements.second) {
    await grantReward(
      tournamentId,
      placements.second,
      'tournament_finalist',
      tournament as Tournament,
      2
    )
  }

  // Grant 3rd place rewards (if exists)
  if (placements.third) {
    await grantReward(
      tournamentId,
      placements.third,
      'tournament_finalist',
      tournament as Tournament,
      3
    )
  }

  // Grant Top 4 badges (only if no custom 3rd badge)
  if (placements.fourth && !tournament.badge_3rd_label) {
    for (const userId of placements.fourth) {
      await grantReward(tournamentId, userId, 'tournament_top4', tournament as Tournament)
    }
  }
}

/**
 * Grant individual reward (badge, pro days, visibility)
 */
async function grantReward(
  tournamentId: string,
  userId: string,
  badgeKey: keyof typeof DEFAULT_BADGE_CONFIG,
  tournament: Tournament,
  placement?: number
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const config = DEFAULT_BADGE_CONFIG[badgeKey]

  // Determine custom badge info based on placement
  let customLabel: string | null = null
  let customImageUrl: string | null = null

  if (placement === 1 && tournament.badge_1st_label) {
    customLabel = tournament.badge_1st_label
    customImageUrl = tournament.badge_1st_image_url
  } else if (placement === 2 && tournament.badge_2nd_label) {
    customLabel = tournament.badge_2nd_label
    customImageUrl = tournament.badge_2nd_image_url
  } else if (placement === 3 && tournament.badge_3rd_label) {
    customLabel = tournament.badge_3rd_label
    customImageUrl = tournament.badge_3rd_image_url
  }

  const badgeLabel = customLabel || config.label
  const badgeImageUrl = customImageUrl

  // Store badge image URL in payload if custom
  const badgePayload: Record<string, unknown> = {}
  if (badgeImageUrl) {
    badgePayload.image_url = badgeImageUrl
  }

  // Grant badge
  const { error: badgeError } = await supabase
    .from('profile_badges')
    .insert({
      user_id: userId,
      badge_key: badgeKey,
      label: badgeLabel,
      tournament_id: tournamentId,
      game_id: tournament.game_id,
      image_url: badgeImageUrl,
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
  const supabase = await createServerSupabaseClient()
  
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

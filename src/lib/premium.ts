/**
 * Premium system utilities
 */

export type PlanTier = 'free' | 'pro' | 'founder'

export interface Profile {
  id: string
  plan_tier: PlanTier
  plan_expires_at: string | null
  stripe_customer_id: string | null
  banner_url: string | null
  custom_tags: string[] | null
}

/**
 * Check if a user has an active Pro subscription
 */
export function isPro(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  
  if (profile.plan_tier !== 'pro' && profile.plan_tier !== 'founder') return false
  
  // Founder tier never expires, pro tier checks expiration
  if (profile.plan_tier === 'founder') return true
  
  // Check if subscription hasn't expired
  if (profile.plan_expires_at) {
    const expiresAt = new Date(profile.plan_expires_at)
    if (expiresAt < new Date()) {
      return false
    }
  }
  
  return true
}

/**
 * Check if a user is Pro or Founder
 */
export function isProOrFounder(profile: Profile | null | undefined): boolean {
  return isPro(profile)
}

/**
 * Get the badge color for a plan tier
 */
export function getPlanTierBadgeColor(planTier: PlanTier | null | undefined): string {
  if (planTier === 'founder') return 'purple'
  if (planTier === 'pro') return 'yellow'
  return 'slate'
}

/**
 * Check if a feature requires Pro
 */
export function requiresPro(feature: string): boolean {
  const proFeatures = [
    'collections',
    'create_events',
    'featured_events',
    'auto_invite',
    'lobby_boost',
    'profile_banner',
    'custom_tags',
    'library_insights',
    'advanced_filters',
  ]
  
  return proFeatures.includes(feature)
}


/**
 * Premium system utilities
 */

export type PlanTier = 'free' | 'pro'

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
  
  if (profile.plan_tier !== 'pro') return false
  
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


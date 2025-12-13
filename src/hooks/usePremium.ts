'use client'

import { useAuth } from '@/hooks/useAuth'
import { isPro } from '@/lib/premium'

export function usePremium() {
  const { profile } = useAuth()
  
  // Check if pro manually since profile type doesn't match exactly
  const isProUser = profile && (
    (profile.plan_tier === 'pro' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ||
    profile.plan_tier === 'founder'
  )
  
  return {
    isPro: isProUser || false,
    profile,
  }
}


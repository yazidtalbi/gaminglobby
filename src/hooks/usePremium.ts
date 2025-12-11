'use client'

import { useAuth } from '@/hooks/useAuth'
import { isPro } from '@/lib/premium'

export function usePremium() {
  const { profile } = useAuth()
  
  return {
    isPro: isPro(profile),
    profile,
  }
}


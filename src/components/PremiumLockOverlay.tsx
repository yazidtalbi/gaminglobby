'use client'

import { Lock } from '@mui/icons-material'
import Link from 'next/link'

interface PremiumLockOverlayProps {
  feature: string
  className?: string
}

export function PremiumLockOverlay({ feature, className = '' }: PremiumLockOverlayProps) {
  return (
    <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 ${className}`}>
      <Lock className="w-12 h-12 text-cyan-400" />
      <div className="text-center px-4">
        <p className="text-white font-title text-lg mb-2">Premium Feature</p>
        <p className="text-slate-300 text-sm mb-4">
          {feature === 'collections' && 'Unlimited collections, pinning, and advanced stats'}
          {feature === 'create_events' && 'Create and manage community events'}
          {feature === 'featured_events' && 'Create featured events for weekly winners'}
          {feature === 'auto_invite' && 'Automatically invite online players to your lobbies'}
          {feature === 'lobby_boost' && 'Boost your lobby to the top with premium visibility'}
          {feature === 'profile_banner' && 'Custom profile banners and themes'}
          {feature === 'custom_tags' && 'Add custom tags to your profile'}
          {feature === 'library_insights' && 'Advanced library statistics and insights'}
          {feature === 'advanced_filters' && 'Advanced lobby filters and visibility options'}
          {!['collections', 'create_events', 'featured_events', 'auto_invite', 'lobby_boost', 'profile_banner', 'custom_tags', 'library_insights', 'advanced_filters'].includes(feature) && 'This feature requires a Pro subscription'}
        </p>
        <Link
          href="/billing"
          className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  )
}


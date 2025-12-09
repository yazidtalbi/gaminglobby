'use client'

import { useMemo } from 'react'

interface OnlineIndicatorProps {
  lastActiveAt: string | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function OnlineIndicator({ 
  lastActiveAt, 
  size = 'sm', 
  showLabel = false,
  className = '' 
}: OnlineIndicatorProps) {
  const { isOnline, statusText } = useMemo(() => {
    if (!lastActiveAt) {
      return { isOnline: false, statusText: 'Offline' }
    }

    const lastActive = new Date(lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - lastActive.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    // Consider online if active within last 5 minutes
    if (diffMinutes < 5) {
      return { isOnline: true, statusText: 'Online' }
    }

    // Format time ago
    if (diffMinutes < 60) {
      return { isOnline: false, statusText: `${diffMinutes}m ago` }
    }

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) {
      return { isOnline: false, statusText: `${diffHours}h ago` }
    }

    const diffDays = Math.floor(diffHours / 24)
    return { isOnline: false, statusText: `${diffDays}d ago` }
  }, [lastActiveAt])

  const sizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className={`
          ${sizes[size]} rounded-full flex-shrink-0
          ${isOnline 
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
            : 'bg-slate-500'
          }
        `}
        title={statusText}
      />
      {showLabel && (
        <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
          {statusText}
        </span>
      )}
    </div>
  )
}

// Positioned indicator (absolute) for avatars
export function OnlineIndicatorDot({ 
  lastActiveAt, 
  size = 'sm',
  position = 'bottom-right' 
}: { 
  lastActiveAt: string | null
  size?: 'sm' | 'md'
  position?: 'bottom-right' | 'top-right'
}) {
  const isOnline = useMemo(() => {
    if (!lastActiveAt) return false
    const lastActive = new Date(lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - lastActive.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return diffMinutes < 5
  }, [lastActiveAt])

  const sizes = {
    sm: 'w-2.5 h-2.5 border-2',
    md: 'w-3.5 h-3.5 border-2',
  }

  const positions = {
    'bottom-right': 'bottom-0 right-0',
    'top-right': 'top-0 right-0',
  }

  return (
    <span
      className={`
        absolute ${positions[position]} ${sizes[size]} rounded-full border-slate-900
        ${isOnline 
          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
          : 'bg-slate-500'
        }
      `}
    />
  )
}


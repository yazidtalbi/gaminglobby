'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string | null
  initialIsFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  className?: string
}

export function FollowButton({
  targetUserId,
  currentUserId,
  initialIsFollowing,
  onFollowChange,
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Sync state with prop changes
  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  const handleClick = async () => {
    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        
        setIsFollowing(false)
        onFollowChange?.(false)
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          })
        
        setIsFollowing(true)
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error('Follow action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Corner brackets */}
      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>&gt; UNFOLLOW</>
        ) : (
          <>&gt; FOLLOW</>
        )}
      </span>
    </button>
  )
}


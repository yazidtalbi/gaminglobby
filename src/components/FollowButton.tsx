'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

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
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isFollowing
          ? 'bg-slate-700 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-slate-600 hover:border-red-500/50'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  )
}


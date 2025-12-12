'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Following {
  id: string
  username: string
  avatar_url: string | null
  plan_tier?: string | null
  plan_expires_at?: string | null
}

interface FollowingsAvatarsProps {
  userId: string | null
}

export function FollowingsAvatars({ userId }: FollowingsAvatarsProps) {
  const supabase = createClient()
  const [followings, setFollowings] = useState<Following[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchFollowings = async () => {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          following:profiles!follows_following_id_fkey(id, username, avatar_url, plan_tier, plan_expires_at)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching followings:', error)
        setIsLoading(false)
        return
      }

      const formattedFollowings: Following[] = (data || [])
        .map((follow: any) => ({
          id: follow.following_id,
          username: (follow.following as any)?.username || 'Unknown',
          avatar_url: (follow.following as any)?.avatar_url || null,
          plan_tier: (follow.following as any)?.plan_tier || null,
          plan_expires_at: (follow.following as any)?.plan_expires_at || null,
        }))
        .filter((f: Following) => f.username !== 'Unknown')

      setFollowings(formattedFollowings)
      setIsLoading(false)
    }

    fetchFollowings()

    // Subscribe to follow changes
    const channel = supabase
      .channel('followings_avatars')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${userId}`,
        },
        () => {
          fetchFollowings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  if (!userId || isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {isLoading && (
            <div className="flex items-center justify-center w-full py-4">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (followings.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {followings.map((following) => (
          <Link
            key={following.id}
            href={`/u/${following.username || following.id}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors relative ${
              following.plan_tier === 'pro' && 
              (!following.plan_expires_at || new Date(following.plan_expires_at) > new Date())
                ? 'border-yellow-400 group-hover:border-yellow-300' 
                : 'border-slate-600 group-hover:border-cyan-400'
            }`}>
              {following.avatar_url ? (
                <img
                  src={following.avatar_url}
                  alt={following.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <span className="text-lg text-slate-400 font-title">
                    {following.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {/* Active indicator */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-cyan-400 transition-colors max-w-[64px] truncate">
              {following.username}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types/database'
import { FollowButton } from './FollowButton'
import { OnlineIndicatorDot } from './OnlineIndicator'
import { X, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  profileId: string
  type: 'followers' | 'following'
}

export function FollowersModal({ isOpen, onClose, profileId, type }: FollowersModalProps) {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isOpen) return

    const fetchUsers = async () => {
      setIsLoading(true)

      if (type === 'followers') {
        // Fetch users who follow this profile
        const { data } = await supabase
          .from('follows')
          .select(`
            follower:profiles!follows_follower_id_fkey(*)
          `)
          .eq('following_id', profileId)

        if (data) {
          const followers = data
            .map((f) => f.follower as unknown as Profile)
            .filter(Boolean)
          setUsers(followers)
        }
      } else {
        // Fetch users this profile follows
        const { data } = await supabase
          .from('follows')
          .select(`
            following:profiles!follows_following_id_fkey(*)
          `)
          .eq('follower_id', profileId)

        if (data) {
          const following = data
            .map((f) => f.following as unknown as Profile)
            .filter(Boolean)
          setUsers(following)
        }
      }

      setIsLoading(false)
    }

    fetchUsers()
  }, [isOpen, profileId, type, supabase])

  // Fetch which users the current user is following
  useEffect(() => {
    if (!isOpen || !user) {
      setFollowingMap({})
      return
    }

    const fetchFollowingStatus = async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (data) {
        const map: Record<string, boolean> = {}
        data.forEach((f) => {
          map[f.following_id] = true
        })
        setFollowingMap(map)
      }
    }

    fetchFollowingStatus()
  }, [isOpen, user, users, supabase])

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setFollowingMap((prev) => ({
      ...prev,
      [targetUserId]: isFollowing,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-app-green-400" />
            <h2 className="text-lg font-semibold text-white">
              {type === 'followers' ? 'Followers' : 'Following'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p>No {type === 'followers' ? 'followers' : 'following'} yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((userProfile) => (
                <div
                  key={userProfile.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <Link
                    href={`/u/${userProfile.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                        {userProfile.avatar_url ? (
                          <img
                            src={userProfile.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
                        )}
                      </div>
                      <OnlineIndicatorDot lastActiveAt={userProfile.last_active_at} size="sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {userProfile.display_name || userProfile.username}
                      </p>
                      <p className="text-sm text-slate-400 truncate">@{userProfile.username}</p>
                    </div>
                  </Link>

                  {/* Follow Button */}
                  {user && user.id !== userProfile.id && (
                    <div className="flex-shrink-0 ml-2">
                      <FollowButton
                        targetUserId={userProfile.id}
                        currentUserId={user.id}
                        initialIsFollowing={followingMap[userProfile.id] || false}
                        onFollowChange={(isFollowing) =>
                          handleFollowChange(userProfile.id, isFollowing)
                        }
                        className="text-xs px-3 py-1.5"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


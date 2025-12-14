'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { X, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface FollowersFollowingModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'followers' | 'following'
}

export function FollowersFollowingModal({ isOpen, onClose, userId, type }: FollowersFollowingModalProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen || !userId) return

    setIsLoading(true)
    const fetchUsers = async () => {
      try {
        if (type === 'followers') {
          // Get users who follow this user
          const { data, error } = await supabase
            .from('follows')
            .select(`
              follower:profiles!follows_follower_id_fkey(
                id,
                username,
                display_name,
                avatar_url,
                plan_tier,
                plan_expires_at
              )
            `)
            .eq('following_id', userId)

          if (error) throw error
          setUsers(data?.map((f: any) => f.follower).filter(Boolean) || [])
        } else {
          // Get users this user follows
          const { data, error } = await supabase
            .from('follows')
            .select(`
              following:profiles!follows_following_id_fkey(
                id,
                username,
                display_name,
                avatar_url,
                plan_tier,
                plan_expires_at
              )
            `)
            .eq('follower_id', userId)

          if (error) throw error
          setUsers(data?.map((f: any) => f.following).filter(Boolean) || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen, userId, type, supabase])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-title text-white uppercase">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                No {type === 'followers' ? 'followers' : 'users being followed'} yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const isPremium = (user.plan_tier === 'pro' && 
                  (!user.plan_expires_at || new Date(user.plan_expires_at) > new Date())) ||
                  user.plan_tier === 'founder'
                const isFounder = user.plan_tier === 'founder'

                return (
                  <Link
                    key={user.id}
                    href={`/u/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className={`relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${
                      isFounder
                        ? 'border border-purple-400' 
                        : isPremium 
                          ? 'border border-yellow-400' 
                          : 'border-0'
                    }`}>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center">
                          <span className="text-lg text-white font-bold">?</span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${isFounder ? 'text-purple-400' : isPremium ? 'text-yellow-400' : 'text-white'}`}>
                          {user.display_name || user.username}
                        </p>
                        {isFounder && (
                          <span className="px-1 py-0 bg-purple-500 text-white text-xs font-title font-bold uppercase">
                            FOUNDER
                          </span>
                        )}
                        {isPremium && !isFounder && (
                          <span className="px-1 py-0 bg-amber-400 text-slate-900 text-xs font-title font-bold uppercase">
                            APEX
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">@{user.username}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

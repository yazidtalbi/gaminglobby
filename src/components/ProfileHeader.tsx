'use client'

import { Profile } from '@/types/database'
import { FollowButton } from './FollowButton'
import { OnlineIndicator, OnlineIndicatorDot } from './OnlineIndicator'
import { Calendar, MessageSquare, Users } from 'lucide-react'

interface ProfileHeaderProps {
  profile: Profile
  currentUserId: string | null
  isFollowing: boolean
  followersCount: number
  followingCount: number
  onFollowChange?: (isFollowing: boolean) => void
}

export function ProfileHeader({
  profile,
  currentUserId,
  isFollowing,
  followersCount,
  followingCount,
  onFollowChange,
}: ProfileHeaderProps) {
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-emerald-600/30 via-cyan-600/30 to-purple-600/30" />

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-700 border-4 border-slate-800">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
            )}
            <OnlineIndicatorDot lastActiveAt={profile.last_active_at} size="md" />
          </div>
        </div>

        {/* Name & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name || profile.username}
              </h1>
              <OnlineIndicator lastActiveAt={profile.last_active_at} showLabel size="md" />
            </div>
            <p className="text-slate-400">@{profile.username}</p>
          </div>

          <FollowButton
            targetUserId={profile.id}
            currentUserId={currentUserId}
            initialIsFollowing={isFollowing}
            onFollowChange={onFollowChange}
          />
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-slate-300 mt-4 leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats & Meta */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
          {/* Discord */}
          {profile.discord_tag && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <MessageSquare className="w-4 h-4" />
              <span>{profile.discord_tag}</span>
            </div>
          )}

          {/* Join date */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        {/* Follow counts */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-white">{followersCount}</span>
            <span className="text-slate-400">Followers</span>
          </div>
          <div>
            <span className="font-semibold text-white">{followingCount}</span>
            <span className="text-slate-400 ml-1.5">Following</span>
          </div>
        </div>
      </div>
    </div>
  )
}


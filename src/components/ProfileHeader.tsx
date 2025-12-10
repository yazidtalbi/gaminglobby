'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { FollowButton } from './FollowButton'
import { InviteToLobbyButton } from './InviteToLobbyButton'
import { FollowersModal } from './FollowersModal'
import { EditProfileModal } from './EditProfileModal'
import { OnlineIndicator, OnlineIndicatorDot } from './OnlineIndicator'
import { Calendar, MessageSquare, Users, MoreHorizontal, AlertTriangle } from 'lucide-react'
import { useRef, useEffect } from 'react'
import { getAwardConfig } from '@/lib/endorsements'

interface ProfileHeaderProps {
  profile: Profile
  currentUserId: string | null
  isFollowing: boolean
  followersCount: number
  followingCount: number
  endorsements?: Array<{ award_type: string; count: number }>
  onFollowChange?: (isFollowing: boolean) => void
  onProfileUpdated?: (updatedProfile: Profile) => void
  onReportClick?: () => void
}

export function ProfileHeader({
  profile,
  currentUserId,
  isFollowing,
  followersCount,
  followingCount,
  endorsements = [],
  onFollowChange,
  onProfileUpdated,
  onReportClick,
}: ProfileHeaderProps) {
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const isOwnProfile = currentUserId === profile.id
  
  const joinDate = new Date(currentProfile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const handleProfileUpdated = (updatedProfile: Profile) => {
    setCurrentProfile(updatedProfile)
    onProfileUpdated?.(updatedProfile)
  }

  const hasCoverImage = (currentProfile as any).cover_image_url

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Banner */}
      {hasCoverImage && (
        <div className="relative h-40 bg-gradient-to-r from-app-green-600/30 via-cyan-600/30 to-purple-600/30">
          <img
            src={(currentProfile as any).cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className={`relative mb-4 ${hasCoverImage ? '-mt-16' : 'mt-6'}`}>
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-700 border-4 border-slate-800">
            {currentProfile.avatar_url ? (
              <img
                src={currentProfile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
            )}
            <OnlineIndicatorDot lastActiveAt={currentProfile.last_active_at} size="md" />
          </div>
        </div>

        {/* Name & Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">
                {currentProfile.display_name || currentProfile.username}
              </h1>
              <OnlineIndicator lastActiveAt={currentProfile.last_active_at} showLabel size="md" />
            </div>
            <p className="text-slate-400">@{currentProfile.username}</p>
          </div>

          {/* Action Buttons - Twitter-style horizontal row */}
          {isOwnProfile && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative flex-shrink-0"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
              <span className="relative z-10">
                &gt; EDIT PROFILE
              </span>
            </button>
          )}
          {!isOwnProfile && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <FollowButton
                targetUserId={currentProfile.id}
                currentUserId={currentUserId}
                initialIsFollowing={isFollowing}
                onFollowChange={onFollowChange}
              />
              {onReportClick && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowReportDropdown(!showReportDropdown)}
                    className="flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                  >
                    {/* Corner brackets */}
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                    <span className="relative z-10">
                      <MoreHorizontal className="w-5 h-5" />
                    </span>
                  </button>
                  {showReportDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          onReportClick()
                          setShowReportDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Report User
                      </button>
                    </div>
                  )}
                </div>
              )}
              <InviteToLobbyButton targetUserId={currentProfile.id} />
            </div>
          )}
        </div>

        {/* Bio */}
        {currentProfile.bio && (
          <p className="text-slate-300 mt-4 leading-relaxed">{currentProfile.bio}</p>
        )}

        {/* Stats & Meta */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
          {/* Discord */}
          {currentProfile.discord_tag && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <MessageSquare className="w-4 h-4" />
              <span>{currentProfile.discord_tag}</span>
            </div>
          )}

          {/* Join date */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        {/* Follow counts & Endorsements */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            onClick={() => setShowFollowersModal(true)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-white">{followersCount}</span>
            <span className="text-slate-400">Followers</span>
          </button>
          <button
            onClick={() => setShowFollowingModal(true)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="font-semibold text-white">{followingCount}</span>
            <span className="text-slate-400 ml-1.5">Following</span>
          </button>
          
          {/* Endorsements */}
          {endorsements.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {endorsements.map((endorsement) => {
                const config = getAwardConfig(endorsement.award_type as any)
                return (
                  <div
                    key={endorsement.award_type}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm"
                  >
                    <span className="text-base">{config.emoji}</span>
                    <span className="text-white font-medium">{config.label}</span>
                    <span className="text-slate-400">×{endorsement.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        profileId={currentProfile.id}
        type="followers"
      />
      <FollowersModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        profileId={currentProfile.id}
        type="following"
      />
      {isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={currentProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  )
}


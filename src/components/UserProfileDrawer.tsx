'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer'
import { Profile, UserGame } from '@/types/database'
import { FollowButton } from '@/components/FollowButton'
import { OnlineIndicatorDot } from './OnlineIndicator'
import { PlayerAwards } from './PlayerAwards'
import { AwardType, getAwardConfig } from '@/lib/endorsements'
import { ProfileBadge } from '@/types/tournaments'
import { InviteToLobbyButton } from './InviteToLobbyButton'
import { FollowersFollowingModal } from './FollowersFollowingModal'
import { CRTCoverImage } from './CRTCoverImage'
import { GameCard } from './GameCard'
import { useAuth } from '@/hooks/useAuth'
import { X, Loader2, Gamepad2, Users, Calendar, MessageSquare, Trophy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

interface UserProfileDrawerProps {
  userId: string | null
  username?: string | null
  isOpen: boolean
  onClose: () => void
}

interface GameWithCover extends UserGame {
  coverUrl?: string | null
}

export function UserProfileDrawer({ userId, username, isOpen, onClose }: UserProfileDrawerProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [games, setGames] = useState<GameWithCover[]>([])
  const [endorsements, setEndorsements] = useState<Array<{ award_type: AwardType; count: number }>>([])
  const [badges, setBadges] = useState<ProfileBadge[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'games' | 'tournaments' | 'events'>('games')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const supabase = createClient()

  const isOwnProfile = user?.id === profile?.id

  const fetchProfile = useCallback(async () => {
    if (!isOpen || (!userId && !username)) {
      setProfile(null)
      setEndorsements([])
      setBadges([])
      setGames([])
      setFollowersCount(0)
      setFollowingCount(0)
      setIsFollowing(false)
      return
    }

    setIsLoading(true)
    try {
      // Fetch profile - use username if available, otherwise use userId
      const profileIdentifier = username || userId
      if (!profileIdentifier) return

      // Check if it's a UUID or username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileIdentifier)
      const query = isUUID
        ? supabase.from('profiles').select('*').eq('id', profileIdentifier)
        : supabase.from('profiles').select('*').eq('username', profileIdentifier)
      
      const { data: profileData, error } = await query.single()

      if (error || !profileData) {
        setIsLoading(false)
        return
      }

      setProfile(profileData)
      const actualProfileId = profileData.id

      // Fetch user games
      const { data: gamesData } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', actualProfileId)
        .order('created_at', { ascending: false })
        .limit(12)

      let gamesWithCovers: GameWithCover[] = []
      if (gamesData) {
        gamesWithCovers = await Promise.all(
          gamesData.map(async (game) => {
            try {
              const response = await fetch(`/api/steamgriddb/game?id=${game.game_id}`)
              const data = await response.json()
              return {
                ...game,
                coverUrl: data.game?.squareCoverThumb || data.game?.squareCoverUrl || null,
              }
            } catch {
              return { ...game, coverUrl: null }
            }
          })
        )
        setGames(gamesWithCovers)
      }

      // Fetch followers count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', actualProfileId)
      setFollowersCount(followers || 0)

      // Fetch following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', actualProfileId)
      setFollowingCount(following || 0)

      // Check if current user follows this profile
      if (user && user.id !== actualProfileId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', actualProfileId)
          .maybeSingle()
        setIsFollowing(!!followData)
      }

      // Fetch endorsements
      const { data: endorsementsData } = await supabase
        .from('player_endorsements')
        .select('award_type')
        .eq('player_id', actualProfileId)

      if (endorsementsData) {
        const counts = endorsementsData.reduce((acc, e) => {
          acc[e.award_type] = (acc[e.award_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        setEndorsements(
          Object.entries(counts).map(([award_type, count]) => ({
            award_type: award_type as AwardType,
            count,
          }))
        )
      }

      // Fetch badges
      const { data: badgesData } = await supabase
        .from('profile_badges')
        .select('*')
        .eq('user_id', actualProfileId)
        .order('created_at', { ascending: false })

      if (badgesData) {
        setBadges(badgesData as ProfileBadge[])
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, userId, username, supabase, user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const hasCoverImage = profile?.banner_url || (profile as any)?.cover_image_url
  const isPremium = profile && ((profile.plan_tier === 'pro' && 
    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ||
    profile.plan_tier === 'founder')
  const isFounder = profile?.plan_tier === 'founder'

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-4xl h-full overflow-y-auto flex flex-col">
        <div className="relative flex-1 flex flex-col">
          {/* Header with Close Button */}
          <div className="absolute top-4 right-4 z-50">
            <DrawerClose asChild>
              <button className="p-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 min-h-[400px]">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : profile ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Hero Banner */}
              {hasCoverImage && (
                <div className="relative h-32 md:h-40 w-full overflow-hidden flex-shrink-0 z-0">
                  <CRTCoverImage
                    src={profile.banner_url || (profile as any).cover_image_url}
                    alt="Cover"
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                </div>
              )}

              <div className="px-4 sm:px-6 py-6 flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Sidebar: Profile Info */}
                  <div className="lg:col-span-7">
                    <div className="bg-slate-800/50 border border-slate-700/50 p-6 relative">
                      {/* Follow/Edit Button - Top Right */}
                      {!isOwnProfile && user && (
                        <div className="absolute top-4 right-4 z-10">
                          <FollowButton
                            targetUserId={profile.id}
                            currentUserId={user.id}
                            initialIsFollowing={isFollowing}
                            onFollowChange={(following) => {
                              setIsFollowing(following)
                              setFollowersCount((prev) => prev + (following ? 1 : -1))
                            }}
                            className="!px-2 !py-1 !text-xs"
                          />
                        </div>
                      )}

                      {/* Avatar */}
                      <div className={`relative mb-6 ${hasCoverImage ? '-mt-20' : ''} z-10`}>
                        <div className={`relative w-32 h-32 rounded-full overflow-hidden bg-slate-700 ${
                          isFounder
                            ? 'border border-purple-400' 
                            : isPremium 
                              ? 'border border-yellow-400' 
                              : 'border-0'
                        }`}>
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-700" />
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h1 className={`text-2xl font-bold font-title ${isFounder ? 'text-purple-400' : isPremium ? 'text-yellow-400' : 'text-white'}`}>
                            {profile.display_name || profile.username}
                          </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-slate-400 text-sm">@{profile.username}</p>
                          {isFounder && (
                            <span className="px-1 py-0 bg-purple-500 text-white text-xs font-title font-bold uppercase flex items-center gap-1">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-white"></div>
                              FOUNDER
                            </span>
                          )}
                          {isPremium && !isFounder && (
                            <span className="px-1 py-0 bg-amber-400 text-slate-900 text-xs font-title font-bold uppercase flex items-center gap-1">
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-slate-900"></div>
                              APEX
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Availability/Status */}
                      <div className="mb-4 flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-lime-400 rounded-full" />
                        <span className="text-slate-300">Online</span>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-6 text-sm">
                        {profile.bio && (
                          <div className="text-slate-300">
                            <p>{profile.bio}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        {profile.discord_tag && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <MessageSquare className="w-4 h-4" />
                            <span>{profile.discord_tag}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 mb-6">
                        {!isOwnProfile && user && (
                          <InviteToLobbyButton targetUserId={profile.id} />
                        )}
                      </div>

                      {/* Stats */}
                      <div className="pt-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Gamepad2 className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-white">{games.length}</span>
                            <span className="text-slate-400">Games</span>
                          </div>
                          <button
                            onClick={() => setShowFollowersModal(true)}
                            className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <span className="font-semibold text-white">{followersCount}</span>
                            <span className="text-slate-400">Followers</span>
                          </button>
                          <button
                            onClick={() => setShowFollowingModal(true)}
                            className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <span className="font-semibold text-white">{followingCount}</span>
                            <span className="text-slate-400">Following</span>
                          </button>
                        </div>
                      </div>

                      {/* Endorsements */}
                      {endorsements.length > 0 && (
                        <>
                          <div className="border-t border-slate-700/50 mt-6 pt-4"></div>
                          <TooltipProvider>
                            <div className="flex items-center gap-2 flex-wrap">
                              {endorsements.map((endorsement) => {
                                const config = getAwardConfig(endorsement.award_type as any)
                                return (
                                  <Tooltip key={endorsement.award_type}>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 border border-slate-600/50 text-sm cursor-pointer">
                                        <span className="text-base">{config.emoji}</span>
                                        <span className="text-slate-400">×{endorsement.count}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{config.label}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })}
                            </div>
                          </TooltipProvider>
                        </>
                      )}

                      {/* Badges */}
                      <div className="border-t border-slate-700/50 mt-6 pt-4">
                        <h3 className="text-sm font-title text-white mb-3 uppercase">Badges</h3>
                        {badges.length > 0 ? (
                          <div className="space-y-3">
                            {badges.map((badge) => {
                              let position = null
                              if (badge.badge_key === 'tournament_winner') {
                                position = '1st Place'
                              } else if (badge.badge_key === 'tournament_finalist') {
                                position = '2nd/3rd Place'
                              } else if (badge.badge_key === 'tournament_top4') {
                                position = 'Top 4'
                              }

                              return (
                                <div
                                  key={badge.id}
                                  className="border border-slate-700/50 bg-slate-800/30 p-3 rounded"
                                >
                                  <div className="flex items-center gap-3">
                                    {badge.image_url ? (
                                      <img
                                        src={badge.image_url}
                                        alt={badge.label}
                                        className="w-16 h-16 object-contain flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                                        <Trophy className="w-8 h-8 text-cyan-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      {position && (
                                        <p className="text-xs text-cyan-400 uppercase mb-1">{position}</p>
                                      )}
                                      <p className="text-sm font-semibold text-white">{badge.label}</p>
                                      {badge.tournament_id && (
                                        <Link
                                          href={`/tournaments/${badge.tournament_id}`}
                                          className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
                                          onClick={onClose}
                                        >
                                          View Tournament →
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No badges earned yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Content: Games Grid */}
                  <div className="lg:col-span-5 flex flex-col">
                    {/* Tabs */}
                    <div className="mb-4 border-b border-slate-700/50 flex-shrink-0">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setActiveTab('games')}
                          className={`pb-2 px-1 font-title text-sm transition-colors ${
                            activeTab === 'games'
                              ? 'border-b-2 border-cyan-500 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Games
                        </button>
                      </div>
                    </div>

                    {/* Games Grid */}
                    {activeTab === 'games' && (
                      <div className="flex-1">
                        {games.length === 0 ? (
                          <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50">
                            <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 mb-2">No games in library yet</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 grid-cols-3 content-start">
                            {games.map((game) => (
                              <div key={game.id} className="relative group">
                                <GameCard
                                  id={game.game_id}
                                  name={game.game_name}
                                  coverUrl={game.coverUrl}
                                  showViewButton={false}
                                  showTitle={false}
                                  square={true}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 min-h-[400px]">
              <p>Profile not found</p>
            </div>
          )}
        </div>

        {/* Modals */}
        {profile && (
          <>
            <FollowersFollowingModal
              isOpen={showFollowersModal}
              onClose={() => setShowFollowersModal(false)}
              userId={profile.id}
              type="followers"
            />
            <FollowersFollowingModal
              isOpen={showFollowingModal}
              onClose={() => setShowFollowingModal(false)}
              userId={profile.id}
              type="following"
            />
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

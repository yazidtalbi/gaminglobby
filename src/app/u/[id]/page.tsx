'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { GameCard } from '@/components/GameCard'
import Link from 'next/link'
import { AddGameModal } from '@/components/AddGameModal'
import { CurrentLobby } from '@/components/CurrentLobby'
import { ReportUserModal } from '@/components/ReportUserModal'
import { CollectionsList } from '@/components/CollectionsList'
import { FollowButton } from '@/components/FollowButton'
import { InviteToLobbyButton } from '@/components/InviteToLobbyButton'
import { EditProfileModal } from '@/components/EditProfileModal'
import { CRTCoverImage } from '@/components/CRTCoverImage'
import { Profile, UserGame } from '@/types/database'
import { AwardType, getAwardConfig } from '@/lib/endorsements'
import { Gamepad2, Loader2, Trash2, MoreHorizontal, AlertTriangle, Calendar, MessageSquare } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface GameWithCover extends UserGame {
  coverUrl?: string | null
}

export default function ProfilePage() {
  const params = useParams()
  const profileIdOrUsername = params.id as string
  const { user } = useAuth()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [games, setGames] = useState<GameWithCover[]>([])
  const [gamesWithVerticalCovers, setGamesWithVerticalCovers] = useState<GameWithCover[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddGame, setShowAddGame] = useState(false)
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null)
  const [endorsements, setEndorsements] = useState<Array<{ award_type: AwardType; count: number }>>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasFetchedRef = useRef(false)

  const isOwnProfile = user?.id === profile?.id

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    const getCacheKey = () => `profile_${profileIdOrUsername}`
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    // Check cache first
    if (!forceRefresh && !hasFetchedRef.current) {
      try {
        const cached = localStorage.getItem(getCacheKey())
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const now = Date.now()
          if (now - timestamp < CACHE_DURATION) {
            setProfile(data.profile)
            setGames(data.games)
            setFollowersCount(data.followersCount)
            setFollowingCount(data.followingCount)
            setIsFollowing(data.isFollowing)
            setEndorsements(data.endorsements)
            setIsLoading(false)
            hasFetchedRef.current = true
            return
          }
        }
      } catch (error) {
        // If cache is invalid, continue to fetch
        console.error('Error reading cache:', error)
      }
    }

    setIsLoading(true)

    // Fetch profile - check if it's a UUID (ID) or username
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileIdOrUsername)
    const query = isUUID
      ? supabase.from('profiles').select('*').eq('id', profileIdOrUsername)
      : supabase.from('profiles').select('*').eq('username', profileIdOrUsername)
    
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

    let gamesWithCovers: GameWithCover[] = []
    if (gamesData) {
      // Fetch squared covers for games (like sidebar)
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

    const followersCountValue = followers || 0
    setFollowersCount(followersCountValue)

    // Fetch following count
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', actualProfileId)

    const followingCountValue = following || 0
    setFollowingCount(followingCountValue)

    // Check if current user follows this profile
    let isFollowingValue = false
    if (user && user.id !== actualProfileId) {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', actualProfileId)
        .maybeSingle()

      // maybeSingle() returns null if no row found, doesn't throw error
      isFollowingValue = !!followData && !followError
      setIsFollowing(isFollowingValue)
    }

    // Fetch endorsements
    const { data: endorsementsData } = await supabase
      .from('player_endorsements')
      .select('award_type')
      .eq('player_id', actualProfileId)

    let endorsementsList: Array<{ award_type: AwardType; count: number }> = []
    if (endorsementsData) {
      // Aggregate by award_type
      const counts = endorsementsData.reduce((acc, e) => {
        acc[e.award_type] = (acc[e.award_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      endorsementsList = Object.entries(counts).map(([award_type, count]) => ({
        award_type: award_type as AwardType,
        count,
      }))
      setEndorsements(endorsementsList)
    }

    // Cache the results
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify({
        data: {
          profile: profileData,
          games: gamesWithCovers,
          followersCount: followersCountValue,
          followingCount: followingCountValue,
          isFollowing: isFollowingValue,
          endorsements: endorsementsList,
        },
        timestamp: Date.now()
      }))
    } catch (error) {
      // If localStorage is full or unavailable, continue
      console.error('Error caching profile:', error)
    }

    setIsLoading(false)
    hasFetchedRef.current = true
  }, [profileIdOrUsername, user, supabase])

  useEffect(() => {
    // Reset fetch flag when profileIdOrUsername changes
    hasFetchedRef.current = false
    fetchProfile()
  }, [fetchProfile])

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!profile || !supabase) return

    const channel = supabase
      .channel(`profile_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        () => {
          fetchProfile(true) // Force refresh on profile changes
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_games',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          fetchProfile(true) // Force refresh on game changes
        }
      )
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'follows',
                  filter: `following_id=eq.${profile.id}`,
                },
                () => {
                  fetchProfile(true) // Force refresh on follow changes
                }
              )
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'follows',
                  filter: user && user.id !== profile.id ? `follower_id=eq.${user.id}` : `follower_id=eq.null`,
                },
                () => {
                  // When current user's follows change, refresh to update isFollowing state
                  if (user && user.id !== profile.id) {
                    fetchProfile(true)
                  }
                }
              )
              .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, supabase, fetchProfile, user])

  // Fetch vertical covers for games (like trending games)
  useEffect(() => {
    async function fetchVerticalCovers() {
      const gamesWithCovers = await Promise.all(
        games.map(async (game) => {
          try {
            const response = await fetch(`/api/steamgriddb/game?id=${game.game_id}`)
            const data = await response.json()
            return {
              ...game,
              coverUrl: data.game?.coverThumb || data.game?.coverUrl || null,
            }
          } catch {
            return { ...game, coverUrl: null }
          }
        })
      )
      setGamesWithVerticalCovers(gamesWithCovers)
    }
    if (games.length > 0) {
      fetchVerticalCovers()
    } else {
      setGamesWithVerticalCovers([])
    }
  }, [games])

  const handleRemoveGame = async (gameId: string) => {
    setDeletingGameId(gameId)

    try {
      await supabase
        .from('user_games')
        .delete()
        .eq('id', gameId)
        .eq('user_id', user?.id)

      setGames((prev) => prev.filter((g) => g.id !== gameId))
      // Trigger instant sidebar update
      window.dispatchEvent(new CustomEvent('libraryUpdated'))
    } catch (error) {
      console.error('Failed to remove game:', error)
    } finally {
      setDeletingGameId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-app-green-400 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-400">Profile not found</p>
        </div>
      </div>
    )
  }

  const hasCoverImage = profile.banner_url || (profile as any).cover_image_url
  const isPremium = (profile.plan_tier === 'pro' && 
    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ||
    profile.plan_tier === 'founder'
  const isFounder = profile.plan_tier === 'founder'

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      {hasCoverImage && (
        <div className="relative h-48 md:h-56 lg:h-64 w-full overflow-hidden">
          <CRTCoverImage
            src={profile.banner_url || (profile as any).cover_image_url}
            alt="Cover"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Profile Info */}
          <div className="lg:col-span-4 lg:sticky lg:top-40 lg:self-start lg:pt-0">
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
                      // Update cache without full refresh - just update the follow status
                      const getCacheKey = () => `profile_${profileIdOrUsername}`
                      try {
                        const cached = localStorage.getItem(getCacheKey())
                        if (cached) {
                          const { data, timestamp } = JSON.parse(cached)
                          data.isFollowing = following
                          data.followersCount = following 
                            ? (data.followersCount || 0) + 1 
                            : Math.max(0, (data.followersCount || 0) - 1)
                          localStorage.setItem(getCacheKey(), JSON.stringify({ data, timestamp }))
                        }
                      } catch (error) {
                        // If cache update fails, silently continue
                        console.error('Error updating cache:', error)
                      }
                    }}
                    className="!px-2 !py-1 !text-xs"
                  />
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded transition-colors"
                  >
                    Customize
                  </button>
                </div>
              )}
              {/* Avatar */}
              <div className={`relative mb-6 ${hasCoverImage ? '-mt-20' : ''} z-0`}>
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
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-slate-700" />
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
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <span className="font-semibold text-white">{followersCount}</span>
                    <span className="text-slate-400">Followers</span>
                  </button>
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
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
            </div>

            {/* Current Lobby */}
            {profile && (
              <div className="mt-6">
                <CurrentLobby userId={profile.id} isOwnProfile={isOwnProfile} disableRealtime={true} />
              </div>
            )}
          </div>

          {/* Main Content: Games Grid */}
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="mb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-6">
                <button className="pb-2 px-1 border-b-2 border-cyan-500 text-white font-title text-sm">
                  Games
                </button>
                {/* Future tabs can go here */}
              </div>
            </div>

            {/* Games Grid */}
            <div>
              <div className="flex items-center justify-end mb-6">
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddGame(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                  >
                    {/* Corner brackets */}
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                    <span className="relative z-10">
                      &gt; ADD GAME
                    </span>
                  </button>
                )}
              </div>

              {gamesWithVerticalCovers.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50">
                  <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-2">No games in library yet</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowAddGame(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative mt-2 mx-auto"
                    >
                      {/* Corner brackets */}
                      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                      <span className="relative z-10">
                        &gt; ADD YOUR FIRST GAME
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {gamesWithVerticalCovers.map((game) => (
                    <div key={game.id} className="relative group">
                      <GameCard
                        id={game.game_id}
                        name={game.game_name}
                        coverUrl={game.coverUrl}
                        showViewButton={true}
                      />
                      {isOwnProfile && (
                        <button
                          onClick={() => handleRemoveGame(game.id)}
                          disabled={deletingGameId === game.id}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
                        >
                          {deletingGameId === game.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && user && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onProfileUpdated={(updatedProfile) => {
            setProfile(updatedProfile)
            fetchProfile(true) // Force refresh
          }}
        />
      )}

      {/* Report User Modal */}
      {user && profile && user.id !== profile.id && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={profile.id}
          reportedUsername={profile.username}
          reporterId={user.id}
        />
      )}

      {/* Add Game Modal */}
      {isOwnProfile && user && (
        <AddGameModal
          isOpen={showAddGame}
          onClose={() => setShowAddGame(false)}
          userId={user.id}
          onGameAdded={() => {
            fetchProfile(true) // Force refresh
            // Trigger instant sidebar update
            window.dispatchEvent(new CustomEvent('libraryUpdated'))
          }}
        />
      )}
    </div>
  )
}



'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { GameCard } from '@/components/GameCard'
import { AddGameModal } from '@/components/AddGameModal'
import { CurrentLobby } from '@/components/CurrentLobby'
import { ReportUserModal } from '@/components/ReportUserModal'
import { FollowButton } from '@/components/FollowButton'
import { InviteToLobbyButton } from '@/components/InviteToLobbyButton'
import { EditProfileModal } from '@/components/EditProfileModal'
import { FollowersFollowingModal } from '@/components/FollowersFollowingModal'
import { CRTCoverImage } from '@/components/CRTCoverImage'
import { ProfilePageSkeleton } from '@/components/ProfilePageSkeleton'
import { Profile, UserGame } from '@/types/database'
import { AwardType, getAwardConfig } from '@/lib/endorsements'
import { ProfileBadge } from '@/types/tournaments'
import { Gamepad2, Loader2, Trash2, Calendar, MessageSquare, Trophy, Award } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import Link from 'next/link'

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
  const [badges, setBadges] = useState<ProfileBadge[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'games' | 'tournaments' | 'events'>('games')
  const [tournaments, setTournaments] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasFetchedRef = useRef(false)

  const isOwnProfile = user?.id === profile?.id

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Dropdown handling removed
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
            setBadges(data.badges || [])
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

    // Fetch badges
    const { data: badgesData } = await supabase
      .from('profile_badges')
      .select('*')
      .eq('user_id', actualProfileId)
      .order('created_at', { ascending: false })

    if (badgesData) {
      setBadges(badgesData as ProfileBadge[])
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
          badges: badgesData || [],
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

  const fetchTournaments = useCallback(async (userId: string) => {
    const { data: tournamentParticipants } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        tournament:tournaments!inner(
          id,
          title,
          game_name,
          status,
          start_at,
          cover_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (tournamentParticipants) {
      setTournaments(tournamentParticipants.map((tp: any) => ({
        ...tp.tournament,
        participation: {
          status: tp.status,
          final_placement: tp.final_placement,
        }
      })))
    }
  }, [supabase])

  const fetchEvents = useCallback(async (userId: string) => {
    const { data: eventParticipants } = await supabase
      .from('event_participants')
      .select(`
        *,
        event:events!inner(
          id,
          game_id,
          game_name,
          start_at,
          end_at,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (eventParticipants) {
      setEvents(eventParticipants.map((ep: any) => ({
        ...ep.event,
        participation: {
          status: ep.status,
        }
      })))
    }
  }, [supabase])

  useEffect(() => {
    if (profile && activeTab === 'tournaments' && tournaments.length === 0) {
      fetchTournaments(profile.id)
    }
    if (profile && activeTab === 'events' && events.length === 0) {
      fetchEvents(profile.id)
    }
  }, [profile, activeTab, tournaments.length, events.length, fetchTournaments, fetchEvents])

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
    return <ProfilePageSkeleton />
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
              <div className="mb-4">
                <OnlineIndicator 
                  lastActiveAt={profile.last_active_at} 
                  showLabel={true}
                  size="sm"
                />
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
                      // Get position from badge_key or tournament participant
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
                <button
                  onClick={() => {
                    setActiveTab('tournaments')
                    if (profile && tournaments.length === 0) {
                      fetchTournaments(profile.id)
                    }
                  }}
                  className={`pb-2 px-1 font-title text-sm transition-colors ${
                    activeTab === 'tournaments'
                      ? 'border-b-2 border-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tournaments
                </button>
                <button
                  onClick={() => {
                    setActiveTab('events')
                    if (profile && events.length === 0) {
                      fetchEvents(profile.id)
                    }
                  }}
                  className={`pb-2 px-1 font-title text-sm transition-colors ${
                    activeTab === 'events'
                      ? 'border-b-2 border-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Events
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'games' ? (
              <>
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
                <>
                  {/* Mobile: Square cards, 3 per row */}
                  <div className="lg:hidden grid gap-4 grid-cols-3">
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
                  
                  {/* Desktop: Vertical cards */}
                  <div className="hidden lg:grid gap-4 grid-cols-4">
                    {gamesWithVerticalCovers.map((game) => (
                      <div key={game.id} className="relative group">
                        <GameCard
                          id={game.game_id}
                          name={game.game_name}
                          coverUrl={game.coverUrl}
                          showViewButton={true}
                          showTitle={true}
                          square={false}
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
                </>
              )}
                </div>
              </>
            ) : activeTab === 'tournaments' ? (
              /* Tournaments Tab */
              <div>
                {tournaments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tournaments.map((tournament: any) => (
                      <Link
                        key={tournament.id}
                        href={`/tournaments/${tournament.id}`}
                        className="border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors p-4"
                      >
                        {tournament.cover_url && (
                          <div className="w-full h-24 mb-3 overflow-hidden">
                            <img
                              src={tournament.cover_url}
                              alt={tournament.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h4 className="text-white font-title font-bold mb-1 line-clamp-1">{tournament.title}</h4>
                        <p className="text-sm text-slate-400 mb-2">{tournament.game_name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className={`px-2 py-0.5 ${
                            tournament.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            tournament.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-600/20 text-slate-400'
                          }`}>
                            {tournament.status}
                          </span>
                          {tournament.participation?.final_placement && (
                            <span className="text-cyan-400 font-semibold">
                              #{tournament.participation.final_placement} Place
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No tournament participations yet</p>
                  </div>
                )}
              </div>
            ) : (
              /* Events Tab */
              <div>
                {events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event: any) => (
                      <div
                        key={event.id}
                        className="border border-slate-700/50 bg-slate-800/30 p-4"
                      >
                        <h4 className="text-white font-title font-bold mb-1">{event.game_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                          <span>{new Date(event.start_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 ${
                            event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            event.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-600/20 text-slate-400'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        {event.participation?.status && (
                          <p className="text-xs text-cyan-400 uppercase">{event.participation.status}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No event participations yet</p>
                  </div>
                )}
              </div>
            )}
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

      {/* Followers Modal */}
      {profile && (
        <FollowersFollowingModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={profile.id}
          type="followers"
        />
      )}

      {/* Following Modal */}
      {profile && (
        <FollowersFollowingModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          userId={profile.id}
          type="following"
        />
      )}
    </div>
  )
}



'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ProfileHeader } from '@/components/ProfileHeader'
import { GameCard } from '@/components/GameCard'
import Link from 'next/link'
import { AddGameModal } from '@/components/AddGameModal'
import { CurrentLobby } from '@/components/CurrentLobby'
import { ReportUserModal } from '@/components/ReportUserModal'
import { CollectionsList } from '@/components/CollectionsList'
import { FollowButton } from '@/components/FollowButton'
import { InviteToLobbyButton } from '@/components/InviteToLobbyButton'
import { EditProfileModal } from '@/components/EditProfileModal'
import { Profile, UserGame } from '@/types/database'
import { AwardType } from '@/lib/endorsements'
import { Gamepad2, Loader2, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react'

interface GameWithCover extends UserGame {
  coverUrl?: string | null
}

export default function ProfilePage() {
  const params = useParams()
  const profileId = params.id as string
  const { user } = useAuth()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [games, setGames] = useState<GameWithCover[]>([])
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

  const isOwnProfile = user?.id === profileId

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
    const getCacheKey = () => `profile_${profileId}`
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

    // Fetch profile
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error || !profileData) {
      setIsLoading(false)
      return
    }

    setProfile(profileData)

    // Fetch user games
    const { data: gamesData } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', profileId)
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
      .eq('following_id', profileId)

    setFollowersCount(followers || 0)

    // Fetch following count
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId)

    setFollowingCount(following || 0)

    // Check if current user follows this profile
    let isFollowingValue = false
    if (user && user.id !== profileId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single()

      isFollowingValue = !!followData
      setIsFollowing(isFollowingValue)
    }

    // Fetch endorsements
    const { data: endorsementsData } = await supabase
      .from('player_endorsements')
      .select('award_type')
      .eq('player_id', profileId)

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
          followersCount: followers || 0,
          followingCount: following || 0,
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
  }, [profileId, user]) // Removed supabase from dependencies

  useEffect(() => {
    // Reset fetch flag when profileId changes
    hasFetchedRef.current = false
    fetchProfile()
  }, [fetchProfile])

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!profileId || !supabase) return

    const channel = supabase
      .channel(`profile_${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profileId}`,
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
          filter: `user_id=eq.${profileId}`,
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
          filter: `following_id=eq.${profileId}`,
        },
        () => {
          fetchProfile(true) // Force refresh on follow changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId, supabase, fetchProfile])

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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 1: Profile Header (Left Side) */}
          <div className="lg:col-span-8 lg:sticky lg:top-24 lg:self-start">
            <ProfileHeader
              profile={profile}
              currentUserId={user?.id || null}
              isFollowing={isFollowing}
              followersCount={followersCount}
              followingCount={followingCount}
              endorsements={endorsements}
              onFollowChange={(following) => {
                setIsFollowing(following)
                setFollowersCount((prev) => prev + (following ? 1 : -1))
              }}
              onProfileUpdated={(updatedProfile) => {
                setProfile(updatedProfile)
              }}
            />
            
            {/* Action Buttons - Below Profile Header */}
            <div className="mt-6 flex items-center gap-2 flex-wrap">
              {isOwnProfile && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
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
                <>
                  <FollowButton
                    targetUserId={profileId}
                    currentUserId={user?.id || null}
                    initialIsFollowing={isFollowing}
                    onFollowChange={(following) => {
                      setIsFollowing(following)
                      setFollowersCount((prev) => prev + (following ? 1 : -1))
                    }}
                  />
                  {user && (
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
                        <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 shadow-xl z-50 overflow-hidden">
                          <button
                            onClick={() => {
                              setShowReportModal(true)
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
                  <InviteToLobbyButton targetUserId={profileId} />
                </>
              )}
            </div>
          </div>

          {/* Section 2: Hosting Lobby + Games (Right Side) */}
          <div className="lg:col-span-4">
            {/* Current Lobby Section */}
            <div className="">
              <CurrentLobby userId={profileId} isOwnProfile={isOwnProfile} />
            </div>

            {/* Collections Section - Premium Only */}
            {/* Temporarily hidden - will be enabled later */}
            {/* {profile && profile.plan_tier === 'pro' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date()) && (
              <div className="mb-8">
                <CollectionsList userId={profileId} isOwnProfile={isOwnProfile} />
              </div>
            )} */}

            {/* Games Library */}
            <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white font-title">
              Games
            </h2>
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
                  &gt; ADD 
                </span>
              </button>
            )}
          </div>

          {games.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50 rounded-xl">
              <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No games in library yet</p>
              {isOwnProfile && (
                <button
                  onClick={() => setShowAddGame(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative mt-2"
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
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              {games.map((game) => (
                <div key={game.id} className="relative group">
                  <SquareGameCard
                    id={game.game_id}
                    name={game.game_name}
                    coverUrl={game.coverUrl}
                  />
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveGame(game.id)}
                      disabled={deletingGameId === game.id}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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
      {user && user.id !== profileId && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={profileId}
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

// Square Game Card Component (like sidebar)
function SquareGameCard({ 
  id, 
  name, 
  coverUrl,
}: {
  id: string | number
  name: string
  coverUrl?: string | null
}) {
  return (
    <Link href={`/games/${id}`} className="block group">
      <div className="relative bg-slate-800/50 overflow-hidden border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 aspect-square">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-slate-600" />
          </div>
        )}
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Game name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="font-title text-white truncate text-xs">{name}</h3>
        </div>
      </div>
    </Link>
  )
}


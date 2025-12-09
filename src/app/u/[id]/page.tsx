'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ProfileHeader } from '@/components/ProfileHeader'
import { GameCard } from '@/components/GameCard'
import { AddGameModal } from '@/components/AddGameModal'
import { CurrentLobby } from '@/components/CurrentLobby'
import { InviteToLobbyButton } from '@/components/InviteToLobbyButton'
import { Profile, UserGame } from '@/types/database'
import { Gamepad2, Plus, Loader2, Trash2 } from 'lucide-react'

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

  const isOwnProfile = user?.id === profileId

  const fetchProfile = useCallback(async () => {
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

    if (gamesData) {
      // Fetch covers for games
      const gamesWithCovers = await Promise.all(
        gamesData.map(async (game) => {
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
    if (user && user.id !== profileId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single()

      setIsFollowing(!!followData)
    }

    setIsLoading(false)
  }, [profileId, supabase, user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleRemoveGame = async (gameId: string) => {
    setDeletingGameId(gameId)

    try {
      await supabase
        .from('user_games')
        .delete()
        .eq('id', gameId)
        .eq('user_id', user?.id)

      setGames((prev) => prev.filter((g) => g.id !== gameId))
    } catch (error) {
      console.error('Failed to remove game:', error)
    } finally {
      setDeletingGameId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div>
          <ProfileHeader
            profile={profile}
            currentUserId={user?.id || null}
            isFollowing={isFollowing}
            followersCount={followersCount}
            followingCount={followingCount}
            onFollowChange={(following) => {
              setIsFollowing(following)
              setFollowersCount((prev) => prev + (following ? 1 : -1))
            }}
            onProfileUpdated={(updatedProfile) => {
              setProfile(updatedProfile)
            }}
          />
          
          {/* Invite Button */}
          {user && user.id !== profileId && (
            <div className="mt-4 flex justify-end">
              <InviteToLobbyButton targetUserId={profileId} />
            </div>
          )}
        </div>

        {/* Current Lobby Section */}
        <div className="mt-6">
          <CurrentLobby userId={profileId} isOwnProfile={isOwnProfile} />
        </div>

        {/* Games Library */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-emerald-400" />
              Games I Play
            </h2>
            {isOwnProfile && (
              <button
                onClick={() => setShowAddGame(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Game
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add your first game
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {games.map((game) => (
                <div key={game.id} className="relative group">
                  <GameCard
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

      {/* Add Game Modal */}
      {isOwnProfile && user && (
        <AddGameModal
          isOpen={showAddGame}
          onClose={() => setShowAddGame(false)}
          userId={user.id}
          onGameAdded={fetchProfile}
        />
      )}
    </div>
  )
}


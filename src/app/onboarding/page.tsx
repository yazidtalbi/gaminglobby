'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { GameSearch } from '@/components/GameSearch'
import { Gamepad2, Loader2, X } from 'lucide-react'

interface SelectedGame {
  id: number
  name: string
  iconUrl?: string | null
}

async function getTrendingGames(supabase: ReturnType<typeof createClient>) {
  // Get games with most searches in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data } = await supabase
    .from('game_search_events')
    .select('game_id')
    .gte('created_at', sevenDaysAgo.toISOString())

  if (!data || data.length === 0) return []

  // Count occurrences
  const counts: Record<string, number> = {}
  data.forEach((event) => {
    counts[event.game_id] = (counts[event.game_id] || 0) + 1
  })

  // Sort by count and get top 9
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)

  return sorted.map(([gameId]) => gameId)
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const supabase = createClient()
  const [selectedGames, setSelectedGames] = useState<SelectedGame[]>([])
  const [trendingGames, setTrendingGames] = useState<SelectedGame[]>([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return

      const { data: userGames } = await supabase
        .from('user_games')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      // If user already has games, redirect to home
      if (userGames && userGames.length > 0) {
        router.push('/')
        return
      }

      // Fetch trending games if onboarding not completed
      setIsLoadingTrending(true)
      try {
        const gameIds = await getTrendingGames(supabase)
        const gamesWithIcons = await Promise.all(
          gameIds.map(async (gameId) => {
            try {
              // Fetch game details via API (client-side)
              const response = await fetch(`/api/steamgriddb/game?id=${gameId}`)
              if (response.ok) {
                const data = await response.json()
                const gameDetails = data.game || data
                return {
                  id: parseInt(gameId),
                  name: gameDetails.name,
                  iconUrl: gameDetails.squareCoverThumb || gameDetails.squareCoverUrl || null,
                }
              }
              return null
            } catch (error) {
              console.error(`Failed to fetch game ${gameId}:`, error)
              return null
            }
          })
        )
        const filtered = gamesWithIcons.filter((g) => g !== null) as SelectedGame[]
        setTrendingGames(filtered)
      } catch (error) {
        console.error('Failed to fetch trending games:', error)
      } finally {
        setIsLoadingTrending(false)
      }
    }

    if (user) {
      checkOnboardingStatus()
    }
  }, [user, supabase, router])

  const handleGameSelect = async (game: { id: number; name: string; coverUrl?: string | null }) => {
    // Check if already selected
    if (selectedGames.some(g => g.id === game.id)) {
      return
    }

    // Fetch game icon from SteamGridDB via API
    let iconUrl: string | null = null
    try {
      const response = await fetch(`/api/steamgriddb/game?id=${game.id}`)
      if (response.ok) {
        const data = await response.json()
        const gameDetails = data.game || data
        iconUrl = gameDetails?.squareCoverThumb || gameDetails?.squareCoverUrl || game.coverUrl || null
      } else {
        // Fallback to coverUrl if API fails
        iconUrl = game.coverUrl || null
      }
    } catch (error) {
      console.error('Failed to fetch game icon:', error)
      // Fallback to coverUrl if available
      iconUrl = game.coverUrl || null
    }

    const newGame: SelectedGame = {
      id: game.id,
      name: game.name,
      iconUrl,
    }

    setSelectedGames([...selectedGames, newGame])
  }

  const handleRemoveGame = (gameId: number) => {
    setSelectedGames(selectedGames.filter(g => g.id !== gameId))
  }

  const handleContinue = async () => {
    if (!user || selectedGames.length === 0) return

    setIsSaving(true)
    try {
      // Check which games are already in library
      const { data: existingGames } = await supabase
        .from('user_games')
        .select('game_id')
        .eq('user_id', user.id)
        .in('game_id', selectedGames.map(g => g.id.toString()))

      const existingGameIds = new Set(existingGames?.map(g => g.game_id) || [])

      // Filter out games that are already in library
      const gamesToAdd = selectedGames
        .filter(game => !existingGameIds.has(game.id.toString()))
        .map(game => ({
          user_id: user.id,
          game_id: game.id.toString(),
          game_name: game.name,
        }))

      // Add new games to user's library
      if (gamesToAdd.length > 0) {
        const { error } = await supabase
          .from('user_games')
          .insert(gamesToAdd)

        if (error) {
          console.error('Failed to add games:', error)
          alert('Failed to add games. Please try again.')
          return
        }
      }

      // Trigger sidebar update
      window.dispatchEvent(new CustomEvent('libraryUpdated'))
      
      // Redirect to home
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to save games:', error)
      alert('Failed to save games. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Don't render if not authenticated
  if (!loading && !user) {
    return null
  }

  const gamesToShow = selectedGames.length > 0 ? selectedGames : trendingGames

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-title text-white mb-3">What&apos;s Your Favorite Game?</h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Add your favorite games to get started. Search for games or choose from trending titles below. You can always add more later.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <GameSearch
            onSelect={handleGameSelect}
            navigateOnSelect={false}
            placeholder="Search for favorite game"
            className="w-full"
          />
        </div>

        {/* Games Grid */}
        <div className="mb-8">
          {isLoadingTrending && selectedGames.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : gamesToShow.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No games to display</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {gamesToShow.map((game) => {
                const isSelected = selectedGames.some(g => g.id === game.id)
                return (
                  <div
                    key={game.id}
                    className={`relative flex items-center gap-4 rounded-lg overflow-hidden bg-slate-800 border ${
                      isSelected
                        ? 'border-cyan-400'
                        : 'border-slate-700/50 hover:border-cyan-500/50'
                    } transition-colors cursor-pointer p-3`}
                    onClick={() => !isSelected && handleGameSelect(game)}
                  >
                    {/* Square Thumbnail on Left */}
                    <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden bg-slate-700 border border-slate-600">
                      {game.iconUrl ? (
                        <img
                          src={game.iconUrl}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                          <Gamepad2 className="w-8 h-8 text-white/80" />
                        </div>
                      )}
                    </div>
                    
                    {/* Game Title on Right - White color */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-title text-white uppercase truncate">
                        {game.name}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveGame(game.id)
                          }}
                          className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-400 transition-colors shadow-lg"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Continue Button */}
        {selectedGames.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="relative w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-title uppercase tracking-wider transition-colors rounded-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SAVING...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


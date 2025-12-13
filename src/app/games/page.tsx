'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'
import { GameCard } from '@/components/GameCard'
import { createClient } from '@/lib/supabase/client'
import { Search, Gamepad2, Loader2, TrendingUp } from 'lucide-react'

interface GameResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
}

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<GameResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [popularGames, setPopularGames] = useState<{ gameId: string; count: number }[]>([])
  const [popularGamesData, setPopularGamesData] = useState<Map<string, { name: string; coverUrl: string | null }>>(new Map())
  const debouncedQuery = useDebounce(searchQuery, 300)
  const supabase = createClient()

  // Fetch popular games on mount with caching
  useEffect(() => {
    const CACHE_KEY = 'popular_games_cache'
    const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

    const fetchPopular = async (forceRefresh = false) => {
      // Check cache first
      if (!forceRefresh) {
        try {
          const cached = localStorage.getItem(CACHE_KEY)
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            const now = Date.now()
            if (now - timestamp < CACHE_DURATION) {
              setPopularGames(data.popularGames)
              setPopularGamesData(new Map(data.popularGamesData))
              return
            }
          }
        } catch (error) {
          console.error('Error reading cache:', error)
        }
      }

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data } = await supabase
        .from('game_search_events')
        .select('game_id')
        .gte('created_at', sevenDaysAgo.toISOString())

      if (!data || data.length === 0) return

      const counts: Record<string, number> = {}
      ;(data as { game_id: string }[]).forEach((event) => {
        counts[event.game_id] = (counts[event.game_id] || 0) + 1
      })

      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([gameId, count]) => ({ gameId, count }))

      setPopularGames(sorted)

      // Batch fetch all popular game data to reduce API calls
      if (sorted.length > 0) {
        try {
          const gameIds = sorted.map(g => g.gameId)
          const response = await fetch('/api/steamgriddb/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameIds }),
          })
          const batchData = await response.json()
          
          const gameDataMap = new Map<string, { name: string; coverUrl: string | null }>()
          batchData.games?.forEach((item: any) => {
            if (item.game) {
              gameDataMap.set(item.gameId, {
                name: item.game.name,
                coverUrl: item.game.coverThumb || item.game.coverUrl || null,
              })
            }
          })
          
          setPopularGamesData(gameDataMap)

          // Cache the results
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              popularGames: sorted,
              popularGamesData: Array.from(gameDataMap.entries()),
              timestamp: Date.now(),
            }))
          } catch (error) {
            console.error('Error caching popular games:', error)
          }
        } catch (error) {
          console.error('Error batch fetching popular games:', error)
        }
      }
    }

    fetchPopular()
  }, [supabase])

  // Search when query changes
  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/steamgriddb/search?query=${encodeURIComponent(debouncedQuery)}`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-title text-white flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-cyan-400" />
            Games
          </h1>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50 text-lg"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 ? (
          <div>
            <h2 className="text-lg font-title text-white mb-4">
              {isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            {!isLoading && results.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No games found</p>
                <p className="text-sm text-slate-500">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {results.map((game) => (
                  <SearchResultCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Popular Games */
          <div>
            <h2 className="text-lg font-title text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Popular Games
            </h2>
            {popularGames.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Start searching for games</p>
                <p className="text-sm text-slate-500">Type in the search box above to find your favorite games</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {popularGames.map(({ gameId }) => (
                  <PopularGameCard 
                    key={gameId} 
                    gameId={gameId}
                    gameData={popularGamesData.get(gameId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SearchResultCard({ game }: { game: GameResult }) {
  const supabase = createClient()

  const handleClick = async () => {
    // Log search event
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('game_search_events').insert({
        game_id: game.id.toString(),
        user_id: user?.id || null,
      })
    } catch (error) {
      console.error('Failed to log search event:', error)
    }
  }

  return (
    <Link 
      href={`/games/${game.id}`}
      onClick={handleClick}
      className="group flex gap-4 bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 rounded-xl overflow-hidden"
    >
      {/* Cover Image - Horizontal */}
      <div className="w-24 h-32 flex-shrink-0 relative overflow-hidden">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center p-4">
        <h3 className="font-title text-white text-lg mb-2">{game.name}</h3>
        <div className="inline-flex items-center justify-center w-fit px-3 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 text-cyan-400 text-sm font-title transition-colors duration-200 relative">
          {/* Corner brackets */}
          <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-cyan-400" />
          <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-cyan-400" />
          <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-cyan-400" />
          <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-cyan-400" />
          <span className="relative z-10">&gt; VIEW LOBBIES</span>
        </div>
      </div>
    </Link>
  )
}

function PopularGameCard({ gameId, gameData }: { gameId: string; gameData?: { name: string; coverUrl: string | null } | null }) {
  const [game, setGame] = useState<{ name: string; coverUrl: string | null } | null>(gameData || null)

  useEffect(() => {
    // If gameData is provided, use it (from batch fetch)
    if (gameData) {
      setGame(gameData)
      return
    }

    // Otherwise fetch individually (fallback)
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/steamgriddb/game?id=${gameId}`)
        const data = await response.json()
        if (data.game) {
          setGame({
            name: data.game.name,
            coverUrl: data.game.coverThumb || data.game.coverUrl,
          })
        }
      } catch {
        // Silently fail
      }
    }

    fetchGame()
  }, [gameId, gameData])

  if (!game) {
    return (
      <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
    )
  }

  return (
    <Link 
      href={`/games/${gameId}`}
      className="group flex gap-4 bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 rounded-xl overflow-hidden"
    >
      {/* Cover Image - Horizontal */}
      <div className="w-24 h-32 flex-shrink-0 relative overflow-hidden">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center p-4">
        <h3 className="font-title text-white text-lg mb-2">{game.name}</h3>
        <div className="inline-flex items-center justify-center w-fit px-3 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 text-cyan-400 text-sm font-title transition-colors duration-200 relative">
          {/* Corner brackets */}
          <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-cyan-400" />
          <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-cyan-400" />
          <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-cyan-400" />
          <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-cyan-400" />
          <span className="relative z-10">&gt; VIEW LOBBIES</span>
        </div>
      </div>
    </Link>
  )
}


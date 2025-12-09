'use client'

import { useState, useEffect } from 'react'
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
  const debouncedQuery = useDebounce(searchQuery, 300)
  const supabase = createClient()

  // Fetch popular games on mount
  useEffect(() => {
    const fetchPopular = async () => {
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-emerald-400" />
            Games
          </h1>
          <p className="text-slate-400">
            Search for any game to find lobbies and communities
          </p>
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
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-lg"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 ? (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              {isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            {!isLoading && results.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No games found</p>
                <p className="text-sm text-slate-500">Try a different search term</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {results.map((game) => (
                  <SearchResultCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Popular Games */
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Popular Games
            </h2>
            {popularGames.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Start searching for games</p>
                <p className="text-sm text-slate-500">Type in the search box above to find your favorite games</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {popularGames.map(({ gameId }) => (
                  <PopularGameCard key={gameId} gameId={gameId} />
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
    <div onClick={handleClick}>
      <GameCard
        id={game.id}
        name={game.name}
        coverUrl={game.coverUrl}
      />
    </div>
  )
}

function PopularGameCard({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<{ name: string; coverUrl: string | null } | null>(null)

  useEffect(() => {
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
  }, [gameId])

  if (!game) {
    return (
      <div className="aspect-[2/3] bg-slate-800/50 rounded-xl animate-pulse" />
    )
  }

  return (
    <GameCard
      id={gameId}
      name={game.name}
      coverUrl={game.coverUrl}
    />
  )
}


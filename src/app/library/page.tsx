'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { GameCard } from '@/components/GameCard'
import { Gamepad2, Loader2, Plus, Library } from 'lucide-react'
import Link from 'next/link'

interface LibraryGame {
  id: number
  game_id: string
  name: string
  iconUrl: string | null
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<LibraryGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchGames = async (forceRefresh = false) => {
      setIsLoading(true)

      // Check cache first
      const getCacheKey = () => `library_games_${user.id}`
      
      if (!forceRefresh) {
        try {
          const cached = localStorage.getItem(getCacheKey())
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
            if (Date.now() - timestamp < CACHE_DURATION) {
              setGames(data)
              setIsLoading(false)
              return
            }
          }
        } catch (error) {
          console.error('Error reading cache:', error)
        }
      }

      // Fetch user's games from database
      const { data: gamesData, error } = await supabase
        .from('user_games')
        .select('id, game_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching games:', error)
        setIsLoading(false)
        return
      }

      if (gamesData && gamesData.length > 0) {
        // Batch fetch game icons
        const gameIds = gamesData.map(g => g.game_id)
        try {
          const response = await fetch('/api/steamgriddb/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameIds }),
          })
          const batchData = await response.json()
          
          // Create a map for quick lookup
          const gameMap = new Map(
            batchData.games?.map((item: any) => [item.gameId, item.game]) || []
          )
          
          // Map games with their icons and names (prioritize square covers)
          const gamesWithIcons = gamesData.map((game) => {
            const gameData = gameMap.get(game.game_id) as any
            return {
              id: game.id,
              game_id: game.game_id,
              name: gameData?.name || 'Unknown Game',
              iconUrl: gameData?.squareCoverThumb || gameData?.squareCoverUrl || null,
            }
          })
          
          setGames(gamesWithIcons)
          
          // Cache the results
          try {
            localStorage.setItem(getCacheKey(), JSON.stringify({
              data: gamesWithIcons,
              timestamp: Date.now()
            }))
          } catch (error) {
            console.error('Error caching games:', error)
          }
        } catch (error) {
          console.error('Error batch fetching game icons:', error)
          // Fallback: set games without icons
          const gamesWithoutIcons = gamesData.map(game => ({ 
            id: game.id,
            game_id: game.game_id,
            name: 'Unknown Game',
            iconUrl: null 
          }))
          setGames(gamesWithoutIcons)
        }
      } else {
        setGames([])
      }
      
      setIsLoading(false)
    }

    fetchGames()

    // Subscribe to changes in user_games
    const channel = supabase
      .channel('user_games_library')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_games',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchGames(true) // Force refresh on any change
        }
      )
      .subscribe()

    // Listen for custom events when games are added/removed
    const handleLibraryUpdate = () => {
      fetchGames(true)
    }

    window.addEventListener('libraryUpdated', handleLibraryUpdate)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('libraryUpdated', handleLibraryUpdate)
    }
  }, [user, authLoading, supabase])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Please sign in to view your library</p>
            <Link
              href="/auth/login"
              className="inline-block mt-4 px-6 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase tracking-wider hover:bg-cyan-300 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-title text-white flex items-center gap-3 mb-2">
            <Library className="w-8 h-8 text-cyan-400" />
            Library
          </h1>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Your library is empty</p>
            <p className="text-sm text-slate-500">Add games to your library to see them here</p>
            <Link
              href="/games"
              className="inline-block mt-4 px-6 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase tracking-wider hover:bg-cyan-300 transition-colors"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-3">
            {games.map((game) => (
              <GameCard
                key={game.id}
                id={game.game_id}
                name={game.name}
                coverUrl={game.iconUrl}
                square={true}
                showTitle={false}
                showViewButton={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

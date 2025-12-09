'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserGame } from '@/types/database'
import { AddGameModal } from './AddGameModal'
import { Gamepad2, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'

interface GameWithIcon extends UserGame {
  iconUrl?: string | null
}

export function Sidebar() {
  const { user } = useAuth()
  const supabase = createClient()
  const [games, setGames] = useState<GameWithIcon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddGameModal, setShowAddGameModal] = useState(false)

  const fetchGamesRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchGames = async () => {
      setIsLoading(true)
      
      // Fetch user games
      const { data: gamesData } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20) // Limit to 20 games for sidebar

      if (gamesData) {
        // Fetch square cover thumbnails for games
        const gamesWithIcons = await Promise.all(
          gamesData.map(async (game) => {
            try {
              // Fetch game icon
              const response = await fetch(`/api/steamgriddb/game?id=${game.game_id}`)
              const data = await response.json()
              
              return {
                ...game,
                iconUrl: data.game?.squareCoverThumb || data.game?.squareCoverUrl || null,
              }
            } catch {
              return { ...game, iconUrl: null }
            }
          })
        )
        setGames(gamesWithIcons)
      }
      
      setIsLoading(false)
    }

    // Store fetchGames in ref so event listener always has latest version
    fetchGamesRef.current = fetchGames

    fetchGames()

    // Subscribe to changes in user_games
    const channel = supabase
      .channel('user_games_sidebar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_games',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchGames() // Refetch on any change
        }
      )
      .subscribe()

    // Listen for custom events when games are added/removed
    const handleLibraryUpdate = () => {
      // Use ref to ensure we always call the latest fetchGames
      if (fetchGamesRef.current) {
        fetchGamesRef.current()
      }
    }

    window.addEventListener('libraryUpdated', handleLibraryUpdate)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('libraryUpdated', handleLibraryUpdate)
    }
  }, [user, supabase])

  if (!user) {
    return null
  }

  return (
    <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-slate-900/50 border-r border-slate-800 overflow-y-auto z-40">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            Library
          </h2>
          {user && (
            <button
              onClick={() => setShowAddGameModal(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Add game to library"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <Gamepad2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No games yet</p>
            <Link
              href={`/u/${user.id}`}
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
            >
              Add games
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.game_id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-slate-700 border border-slate-600">
                  {game.iconUrl ? (
                    <img
                      src={game.iconUrl}
                      alt={game.game_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {game.game_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Game Modal */}
      {user && (
        <AddGameModal
          isOpen={showAddGameModal}
          onClose={() => setShowAddGameModal(false)}
          userId={user.id}
          onGameAdded={() => {
            // Sidebar will update automatically via event listener
          }}
        />
      )}
    </aside>
  )
}


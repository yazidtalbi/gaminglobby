'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserGame } from '@/types/database'
import { AddGameModal } from './AddGameModal'
import { SidebarControls, SortOption, ViewMode } from './SidebarControls'
import { Gamepad2, Loader2, Plus, Library, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface GameWithIcon extends UserGame {
  iconUrl?: string | null
}

export function Sidebar() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [games, setGames] = useState<GameWithIcon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddGameModal, setShowAddGameModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recently_added')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [alphabeticalReverse, setAlphabeticalReverse] = useState(false)
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_compact')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  const fetchGamesRef = useRef<(() => Promise<void>) | null>(null)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize CSS variable on mount
      const initialWidth = isCompact ? '4rem' : '18rem'
      document.documentElement.style.setProperty('--sidebar-width', initialWidth)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_compact', JSON.stringify(isCompact))
      // Update CSS variable for main content margin
      document.documentElement.style.setProperty(
        '--sidebar-width',
        isCompact ? '4rem' : '18rem' // 16 = 4rem, 72 = 18rem
      )
    }
  }, [isCompact])

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const getCacheKey = () => `sidebar_games_${user.id}`
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    const fetchGames = async (forceRefresh = false) => {
      // Check cache first
      if (!forceRefresh && !hasFetchedRef.current) {
        try {
          const cached = localStorage.getItem(getCacheKey())
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            const now = Date.now()
            if (now - timestamp < CACHE_DURATION) {
              setGames(data)
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
        
        // Cache the results
        try {
          localStorage.setItem(getCacheKey(), JSON.stringify({
            data: gamesWithIcons,
            timestamp: Date.now()
          }))
        } catch (error) {
          // If localStorage is full or unavailable, continue
          console.error('Error caching games:', error)
        }
      }
      
      setIsLoading(false)
      hasFetchedRef.current = true
    }

    // Store fetchGames in ref so event listener always has latest version
    fetchGamesRef.current = () => fetchGames(true)

    // Only fetch if we haven't fetched yet
    if (!hasFetchedRef.current) {
      fetchGames()
    }

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
          fetchGames(true) // Force refresh on any change
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
  }, [user]) // Removed supabase from dependencies

  if (!user) {
    return null
  }

  return (
    <aside className={`hidden lg:block fixed left-0 top-16 bottom-0 bg-slate-900/50 border-r border-slate-800 overflow-y-auto overflow-x-visible z-40 transition-all duration-300 ${
      isCompact ? 'w-16' : 'w-72'
    }`}>
      <div className={`${isCompact ? 'p-2 pb-16' : 'p-4 pb-20'}`}>
        <div className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'} mb-4`}>
          {!isCompact && (
            <h2 className="text-base font-title text-slate-400">
              Library
            </h2>
          )}
          <div className="flex items-center gap-1">
            {user && !isCompact && (
              <button
                onClick={() => setShowAddGameModal(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Add game to library"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isCompact ? 'Expand sidebar' : 'Compact sidebar'}
            >
              {isCompact ? (
                <Library className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className={`text-center py-8 ${isCompact ? 'px-0' : ''}`}>
            {!isCompact && (
              <>
                <Gamepad2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No games yet</p>
                <Link
                  href={`/u/${profile?.username || user.id}`}
                  className="text-xs text-app-green-400 hover:text-emerald-300 mt-2 inline-block"
                >
                  Add games
                </Link>
              </>
            )}
            {isCompact && (
              <Gamepad2 className="w-6 h-6 text-slate-600 mx-auto" />
            )}
          </div>
        ) : (
          <>
            {/* Sidebar Controls */}
            {!isCompact && (
              <SidebarControls
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                alphabeticalReverse={alphabeticalReverse}
                onAlphabeticalReverseChange={setAlphabeticalReverse}
              />
            )}

            {/* Filtered and Sorted Games */}
            {(() => {
          // Filter games by search query
          const filteredGames = games.filter((game) =>
            game.game_name.toLowerCase().includes(searchQuery.toLowerCase())
          )

          // Sort games
          const sortedGames = [...filteredGames].sort((a, b) => {
            switch (sortBy) {
              case 'recently_added':
                // Sort by created_at descending (most recently added first)
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              case 'alphabetical':
                // Sort alphabetically by game name (with reverse option)
                const comparison = a.game_name.localeCompare(b.game_name)
                return alphabeticalReverse ? -comparison : comparison
              default:
                return 0
            }
          })

          if (sortedGames.length === 0 && searchQuery) {
            return (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">No games found</p>
              </div>
            )
          }

          // Compact mode - show only icons
          if (isCompact) {
            return (
              <div className="space-y-2">
                {sortedGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.game_id}`}
                    className="block p-1 rounded-lg hover:bg-slate-800/50 transition-colors group"
                    title={game.game_name}
                  >
                    <div className="w-full aspect-square rounded overflow-hidden bg-slate-700 border border-slate-600">
                      {game.iconUrl ? (
                        <img
                          src={game.iconUrl}
                          alt={game.game_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-white/50" />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {/* Add game button at the end */}
                <button
                  onClick={() => setShowAddGameModal(true)}
                  className="w-full p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                  title="Add game"
                >
                  <div className="w-full aspect-square rounded overflow-hidden bg-slate-800/50 border-2 border-dashed border-slate-600 hover:border-app-green-500/50 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>
            )
          }

          // Render based on view mode
          if (viewMode === 'grid' || viewMode === 'grid_large') {
            const cols = viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'
            return (
              <div className={`grid ${cols} gap-2`}>
                {sortedGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.game_id}`}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-app-green-500/50 transition-colors"
                  >
                    {game.iconUrl ? (
                      <img
                        src={game.iconUrl}
                        alt={game.game_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs font-title text-white line-clamp-2">
                          {game.game_name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          }

          if (viewMode === 'detailed') {
            return (
              <div className="space-y-2">
                {sortedGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.game_id}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-slate-700 border border-slate-600">
                      {game.iconUrl ? (
                        <img
                          src={game.iconUrl}
                          alt={game.game_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-title text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {game.game_name}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Added {new Date(game.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          }

          // Default list view
          return (
            <div className="space-y-2">
              {sortedGames.map((game) => (
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
                      <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 text-white/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-title text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {game.game_name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        })()}
          </>
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


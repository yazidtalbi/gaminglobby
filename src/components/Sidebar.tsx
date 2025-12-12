'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserGame } from '@/types/database'
import { AddGameModal } from './AddGameModal'
import { SidebarControls, SortOption, ViewMode } from './SidebarControls'
import { SidebarLoggedOut } from './SidebarLoggedOut'
import { Gamepad2, Loader2, Plus, Library, ChevronLeft, Zap } from 'lucide-react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface GameWithIcon extends UserGame {
  iconUrl?: string | null
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [games, setGames] = useState<GameWithIcon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddGameModal, setShowAddGameModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recently_added')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [alphabeticalReverse, setAlphabeticalReverse] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_width')
      return saved ? parseInt(saved, 10) : 288 // Default to 288px (w-72)
    }
    return 288
  })
  const [isResizing, setIsResizing] = useState(false)
  const [quickMatchingGameId, setQuickMatchingGameId] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLAsideElement>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(288)
  const router = useRouter()

  const isCompact = sidebarWidth < 200

  // Force reset sidebar width when user is logged out
  useEffect(() => {
    if (!user) {
      setSidebarWidth(288)
    }
  }, [user])

  // Handle resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = resizeStartWidth.current + (e.clientX - resizeStartX.current)
      const minWidth = 64 // Minimum width (w-16)
      const maxWidth = 512 // Maximum width
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setSidebarWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (typeof window !== 'undefined' && user) {
        // Save the current width when resizing ends
        const currentWidth = sidebarRef.current?.offsetWidth || sidebarWidth
        localStorage.setItem('sidebar_width', currentWidth.toString())
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, sidebarWidth, user])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = sidebarWidth
  }

  const handleQuickMatch = async (e: React.MouseEvent, game: GameWithIcon) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    setQuickMatchingGameId(game.game_id)
    
    try {
      const preferredPlatform = (profile as any)?.preferred_platform || 'pc'
      
      const response = await fetch('/api/lobbies/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.game_id,
          gameName: game.game_name,
          platform: preferredPlatform,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Failed to create lobby:', data.error)
        return
      }

      router.push(`/lobbies/${data.lobbyId}`)
    } catch (error) {
      console.error('Failed to create quick lobby:', error)
    } finally {
      setQuickMatchingGameId(null)
    }
  }

  const fetchGamesRef = useRef<(() => Promise<void>) | null>(null)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize CSS variable on mount
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Don't set sidebar width on auth pages
      if (pathname?.startsWith('/auth/')) {
        document.documentElement.style.setProperty('--sidebar-width', '0')
        return
      }
      // Save sidebar width if user is logged in
      if (user) {
        localStorage.setItem('sidebar_width', sidebarWidth.toString())
      }
      // Update CSS variable for main content margin
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`)
    }
  }, [sidebarWidth, user, pathname])

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

      if (gamesData && gamesData.length > 0) {
        // Batch fetch all game icons in a single request
        try {
          const gameIds = gamesData.map(g => g.game_id)
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
          
          // Map games with their icons
          const gamesWithIcons = gamesData.map((game) => {
            const gameData = gameMap.get(game.game_id)
            return {
              ...game,
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
            // If localStorage is full or unavailable, continue
            console.error('Error caching games:', error)
          }
        } catch (error) {
          console.error('Error batch fetching game icons:', error)
          // Fallback: set games without icons
          const gamesWithoutIcons = gamesData.map(game => ({ ...game, iconUrl: null }))
          setGames(gamesWithoutIcons)
          
          // Cache fallback results
          try {
            localStorage.setItem(getCacheKey(), JSON.stringify({
              data: gamesWithoutIcons,
              timestamp: Date.now()
            }))
          } catch (cacheError) {
            console.error('Error caching games:', cacheError)
          }
        }
      } else {
        setGames([])
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

  // Hide sidebar on auth pages and onboarding (after all hooks are declared)
  if (pathname?.startsWith('/auth/') || pathname === '/onboarding') {
    return null
  }

  if (!user) {
    return <SidebarLoggedOut />
  }

  return (
    <aside 
      ref={sidebarRef}
      className={`hidden lg:block fixed left-0 top-16 bottom-0 bg-slate-900/50 border-r border-slate-800 overflow-y-auto overflow-x-visible z-40 sidebar-scrollbar ${
        isResizing ? '' : 'transition-all duration-300'
      }`}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors ${
          isResizing ? 'bg-cyan-500' : ''
        }`}
        style={{ zIndex: 50 }}
        title="Drag to resize sidebar"
      />
      {/* Wider invisible hit area for easier grabbing */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize"
        style={{ zIndex: 49 }}
      />
      <div className={`${isCompact ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'} mb-4`}>
          {!isCompact && (
            <h2 className="text-base font-title text-slate-400">
              LIBRARY
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
            {user && (
              <button
                onClick={() => {
                  const newWidth = isCompact ? 288 : 64
                  setSidebarWidth(newWidth)
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('sidebar_width', newWidth.toString())
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={isCompact ? 'Expand sidebar' : 'Compact sidebar'}
              >
                {isCompact ? (
                  <Library className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Separator beneath LIBRARY header */}
        {!isCompact && (
          <div className="border-b border-slate-700/50 mb-4" />
        )}

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
              <TooltipProvider>
                <div className="space-y-2">
                  {sortedGames.map((game) => (
                    <Tooltip key={game.id}>
                      <TooltipTrigger asChild>
                        <div className="block p-1 rounded-lg hover:bg-slate-800/50 transition-colors group">
                          <div 
                            className="relative w-full aspect-square rounded overflow-hidden bg-slate-700 border border-slate-600 cursor-pointer"
                            onClick={(e) => handleQuickMatch(e, game)}
                          >
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
                            {/* Hover overlay with volt icon */}
                            <div className="absolute inset-0 bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {quickMatchingGameId === game.game_id ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              ) : (
                                <Zap className="w-6 h-6 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{game.game_name}</p>
                      </TooltipContent>
                    </Tooltip>
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
              </TooltipProvider>
            )
          }

          // Render based on view mode
          if (viewMode === 'grid' || viewMode === 'grid_large') {
            const cols = viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'
            return (
              <div className={`grid ${cols} gap-2`}>
                {sortedGames.map((game) => (
                  <div
                    key={game.id}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-app-green-500/50 transition-colors"
                  >
                    <div
                      className="absolute inset-0 cursor-pointer"
                      onClick={(e) => handleQuickMatch(e, game)}
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
                      {/* Hover overlay with volt icon */}
                      <div className="absolute inset-0 bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        {quickMatchingGameId === game.game_id ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                          <Zap className="w-8 h-8 text-white" />
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/games/${game.game_id}`}
                      className="absolute inset-0 z-0 pointer-events-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-xs font-title text-white line-clamp-2">
                            {game.game_name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )
          }

          if (viewMode === 'detailed') {
            return (
              <div className="space-y-2">
                {sortedGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  >
                    <div 
                      className="relative flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-slate-700 border border-slate-600 cursor-pointer"
                      onClick={(e) => handleQuickMatch(e, game)}
                    >
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
                      {/* Hover overlay with volt icon */}
                      <div className="absolute inset-0 bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {quickMatchingGameId === game.game_id ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Zap className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/games/${game.game_id}`}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-base font-title text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {game.game_name}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Added {new Date(game.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            )
          }

          // Default list view
          return (
            <div className="space-y-2">
              {sortedGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
                >
                  <div 
                    className="relative flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-slate-700 border border-slate-600 cursor-pointer"
                    onClick={(e) => handleQuickMatch(e, game)}
                  >
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
                    {/* Hover overlay with volt icon */}
                    <div className="absolute inset-0 bg-lime-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {quickMatchingGameId === game.game_id ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/games/${game.game_id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-base font-title text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {game.game_name}
                    </p>
                  </Link>
                </div>
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


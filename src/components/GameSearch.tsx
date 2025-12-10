'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Search from '@mui/icons-material/Search'
import Refresh from '@mui/icons-material/Refresh'
import SportsEsports from '@mui/icons-material/SportsEsports'
import Computer from '@mui/icons-material/Computer'
import People from '@mui/icons-material/People'
import Bolt from '@mui/icons-material/Bolt'

interface GameResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
  lobbyCount?: number
}

interface GameSearchProps {
  onSelect?: (game: GameResult) => void
  navigateOnSelect?: boolean
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  autoFocus?: boolean
  showQuickMatch?: boolean
}

const platforms = [
  { value: 'pc', label: 'PC', icon: Computer },
  { value: 'ps', label: 'PS', icon: SportsEsports },
  { value: 'xbox', label: 'Xbox', icon: SportsEsports },
  { value: 'switch', label: 'Switch', icon: SportsEsports },
  { value: 'mobile', label: 'Mobile', icon: SportsEsports },
  { value: 'other', label: 'Other', icon: SportsEsports },
] as const

type Platform = typeof platforms[number]['value']

export function GameSearch({
  onSelect,
  navigateOnSelect = true,
  placeholder = 'Search games...',
  className = '',
  size = 'md',
  autoFocus = false,
  showQuickMatch = false,
}: GameSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('pc')
  const [isCreatingLobby, setIsCreatingLobby] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/steamgriddb/search?query=${encodeURIComponent(debouncedQuery)}`)
        const data = await response.json()
        const games = data.results || []
        
        // Fetch lobby counts for all games
        if (games.length > 0) {
          const gameIds = games.map((g: GameResult) => g.id.toString())
          try {
            const countResponse = await fetch('/api/lobbies/count', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameIds }),
            })
            const countData = await countResponse.json()
            const counts = countData.counts || {}
            
            // Add lobby counts to results
            games.forEach((game: GameResult) => {
              game.lobbyCount = counts[game.id.toString()] || 0
            })
          } catch (error) {
            console.error('Failed to fetch lobby counts:', error)
          }
        }
        
        setResults(games)
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (game: GameResult) => {
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

    if (onSelect) {
      onSelect(game)
    }

    if (navigateOnSelect) {
      // If game has lobbies, navigate to game page
      // Otherwise, create quick lobby if showQuickMatch is enabled
      if (game.lobbyCount && game.lobbyCount > 0) {
        router.push(`/games/${game.id}`)
      } else if (showQuickMatch && user) {
        await handleQuickMatch(game)
      } else {
        router.push(`/games/${game.id}`)
      }
    }

    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleQuickMatch = async (game: GameResult) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsCreatingLobby(true)
    try {
      const response = await fetch('/api/lobbies/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id.toString(),
          gameName: game.name,
          platform: selectedPlatform,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Failed to create quick lobby:', data.error)
        // Fallback to game page
        router.push(`/games/${game.id}`)
      } else {
        // Navigate to the created lobby
        router.push(`/lobbies/${data.lobbyId}`)
      }
    } catch (error) {
      console.error('Error creating quick lobby:', error)
      // Fallback to game page
      router.push(`/games/${game.id}`)
    } finally {
      setIsCreatingLobby(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full ${sizeClasses[size]} pl-11 pr-10
            bg-slate-800/50 border border-cyan-500/30
            text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
            transition-all duration-200
          `}
        />
        {isLoading && (
          <Refresh className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-cyan-500/30 shadow-2xl overflow-hidden">
          {/* Platform Selector (only when showQuickMatch is true) */}
          {showQuickMatch && (
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Platform:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {platforms.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedPlatform(value)}
                      className={`
                        flex items-center gap-1 px-2 py-1 text-xs transition-colors relative border
                        ${selectedPlatform === value
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-cyan-500/30'
                        }
                      `}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="max-h-96 overflow-y-auto">
            {results.map((game, index) => (
              <div
                key={game.id}
                className={`
                  w-full flex items-center gap-3 p-3
                  transition-colors duration-150
                  ${index === selectedIndex ? 'bg-slate-700' : 'hover:bg-slate-700/50'}
                `}
              >
                <button
                  onClick={() => handleSelect(game)}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  {game.coverUrl ? (
                    <img
                      src={game.coverUrl}
                      alt={game.name}
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                      <SportsEsports className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-title truncate">{game.name}</p>
                    {game.lobbyCount !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <People className="w-3 h-3" />
                        <span>{game.lobbyCount} {game.lobbyCount === 1 ? 'lobby' : 'lobbies'}</span>
                      </div>
                    )}
                  </div>
                </button>
                {showQuickMatch && user && (!game.lobbyCount || game.lobbyCount === 0) && (
                  <button
                    onClick={() => handleQuickMatch(game)}
                    disabled={isCreatingLobby}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-xs font-medium uppercase tracking-wider border border-cyan-500 transition-colors relative"
                    title="Quick Matchmaking"
                  >
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
                    {isCreatingLobby ? (
                      <Refresh className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Bolt className="w-3 h-3" />
                        <span>Quick Match</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-cyan-500/30 shadow-2xl p-4 text-center text-slate-400">
          No games found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}


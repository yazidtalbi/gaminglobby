'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Search from '@mui/icons-material/Search'
import Refresh from '@mui/icons-material/Refresh'
import SportsEsports from '@mui/icons-material/SportsEsports'
import People from '@mui/icons-material/People'
import Bolt from '@mui/icons-material/Bolt'
import Link from 'next/link'

interface GameResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
  lobbyCount?: number
}

interface MatchmakingModalProps {
  isOpen: boolean
  onClose: () => void
  trendingGames: any[] // Not used anymore but kept for prop compatibility
}

const platforms = [
  {
    name: 'PC',
    slug: 'pc',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/windows.svg'
  },
  {
    name: 'PlayStation',
    slug: 'playstation',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/playstation.svg'
  },
  {
    name: 'Xbox',
    slug: 'xbox',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/xbox.svg'
  },
  {
    name: 'Switch',
    slug: 'switch',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nintendoswitch.svg'
  },
  {
    name: 'Mobile',
    slug: 'mobile',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/android.svg'
  },
  {
    name: 'Other',
    slug: 'other',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gamepad.svg'
  },
] as const

type Platform = typeof platforms[number]['slug']

export function MatchmakingModal({ isOpen, onClose, trendingGames }: MatchmakingModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('pc')
  const [isCreatingLobby, setIsCreatingLobby] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  // Load preferred platform from profile
  useEffect(() => {
    if (profile && (profile as any).preferred_platform) {
      const preferred = (profile as any).preferred_platform as Platform
      if (platforms.some(p => p.slug === preferred)) {
        setSelectedPlatform(preferred)
      }
    }
  }, [profile])

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
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
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Focus input when modal opens and handle ESC key
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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

    // Navigate to game page if it has lobbies
    if (game.lobbyCount && game.lobbyCount > 0) {
      router.push(`/games/${game.id}`)
      onClose()
    }
  }

  const handleQuickMatch = async (e: React.MouseEvent, game: GameResult) => {
    e.stopPropagation()
    
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
        console.error('Failed to create lobby:', data.error)
        return
      }

      router.push(`/lobbies/${data.lobbyId}`)
      onClose()
    } catch (error) {
      console.error('Failed to create quick lobby:', error)
    } finally {
      setIsCreatingLobby(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-cyan-500/30 shadow-2xl mt-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any game..."
              className="w-full h-11 pl-11 pr-10 bg-slate-900 text-white placeholder-slate-400 focus:outline-none transition-all duration-200"
            />
            {isLoading && (
              <Refresh className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Platform Selector */}
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-400 font-medium">Platform:</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {platforms.map((platform) => (
              <button
                key={platform.slug}
                onClick={() => setSelectedPlatform(platform.slug)}
                className={`
                  flex items-center gap-1.5 px-2 py-1.5 transition-colors duration-150
                  ${selectedPlatform === platform.slug
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }
                `}
              >
                <img 
                  src={platform.icon} 
                  alt={platform.name}
                  className="w-4 h-4"
                  style={{ filter: selectedPlatform === platform.slug ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.5)' }}
                />
                <span className="text-xs font-medium">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {results.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleSelect(game)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600/50">
                      {game.coverUrl ? (
                        <img src={game.coverUrl} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <SportsEsports className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-title truncate">{game.name}</p>
                      {game.lobbyCount !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <People className="w-3 h-3" />
                          <span>{game.lobbyCount} {game.lobbyCount === 1 ? 'lobby' : 'lobbies'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {game.lobbyCount !== undefined && game.lobbyCount > 0 ? (
                      <Link
                        href={`/games/${game.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                        }}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-title relative transition-colors duration-200"
                      >
                        <span className="absolute top-[-1px] left-[-1px] w-1.5 h-1.5 border-t border-l border-white" />
                        <span className="absolute top-[-1px] right-[-1px] w-1.5 h-1.5 border-t border-r border-white" />
                        <span className="absolute bottom-[-1px] left-[-1px] w-1.5 h-1.5 border-b border-l border-white" />
                        <span className="absolute bottom-[-1px] right-[-1px] w-1.5 h-1.5 border-b border-r border-white" />
                        JOIN
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => handleQuickMatch(e, game)}
                        className="px-3 py-1 bg-app-green-600 hover:bg-app-green-700 text-white text-xs font-title relative transition-colors duration-200 flex items-center gap-1"
                        disabled={isCreatingLobby}
                      >
                        <span className="absolute top-[-1px] left-[-1px] w-1.5 h-1.5 border-t border-l border-white" />
                        <span className="absolute top-[-1px] right-[-1px] w-1.5 h-1.5 border-t border-r border-white" />
                        <span className="absolute bottom-[-1px] left-[-1px] w-1.5 h-1.5 border-b border-l border-white" />
                        <span className="absolute bottom-[-1px] right-[-1px] w-1.5 h-1.5 border-b border-r border-white" />
                        {isCreatingLobby ? (
                          <Refresh className="animate-spin w-4 h-4" />
                        ) : (
                          <>
                            <Bolt className="w-4 h-4" />
                            QUICK MATCH
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 && !isLoading ? (
            <div className="p-8 text-center text-slate-400">
              No games found
            </div>
          ) : query.length < 2 ? (
            <div className="p-8 text-center text-slate-400">
              Start typing to search for games...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

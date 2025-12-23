'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Search from '@mui/icons-material/Search'
import Refresh from '@mui/icons-material/Refresh'
import SportsEsports from '@mui/icons-material/SportsEsports'
import People from '@mui/icons-material/People'
import Bolt from '@mui/icons-material/Bolt'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Link from 'next/link'
import { generateSlug } from '@/lib/slug'
import { Avatar } from '@/components/Avatar'

interface GameResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
  lobbyCount?: number
}

interface PlayerResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  plan_tier: string | null
  plan_expires_at: string | null
  last_active_at: string | null
}

type SearchType = 'games' | 'players'

interface NavbarSearchModalProps {
  isOpen: boolean
  onClose: () => void
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

export function NavbarSearchModal({ isOpen, onClose }: NavbarSearchModalProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('games')
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('pc')
  const [isCreatingLobby, setIsCreatingLobby] = useState(false)
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load preferred platform from profile
  useEffect(() => {
    if (profile && (profile as any).preferred_platform) {
      const preferred = (profile as any).preferred_platform as Platform
      if (platforms.some(p => p.slug === preferred)) {
        setSelectedPlatform(preferred)
      }
    }
  }, [profile])

  // Reset query and close dropdown when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setGameResults([])
      setPlayerResults([])
      setShowPlatformDropdown(false)
    }
  }, [isOpen])

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        if (searchType === 'games') {
          setGameResults([])
        } else {
          setPlayerResults([])
        }
        return
      }

      setIsLoading(true)
      
      try {
        if (searchType === 'games') {
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
          
          setGameResults(games)
        } else {
          // Search players
          const response = await fetch(`/api/players/search?query=${encodeURIComponent(debouncedQuery)}`)
          const data = await response.json()
          setPlayerResults(data.results || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
        if (searchType === 'games') {
          setGameResults([])
        } else {
          setPlayerResults([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery, searchType])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPlatformDropdown(false)
      }
    }

    if (showPlatformDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPlatformDropdown])

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

    // Navigate to game page
    const gameSlug = generateSlug(game.name)
    router.push(`/games/${gameSlug}`)
    onClose()
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

  const selectedPlatformData = platforms.find(p => p.slug === selectedPlatform)

  const results = searchType === 'games' ? gameResults : playerResults
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] !flex !flex-col !grid-cols-none p-0 bg-slate-800 border-slate-700 [&>button]:hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setSearchType('games')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              searchType === 'games'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SportsEsports className="w-4 h-4" />
              Games
            </div>
          </button>
          <button
            onClick={() => setSearchType('players')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              searchType === 'players'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <People className="w-4 h-4" />
              Players
            </div>
          </button>
        </div>

        {/* Search Input with Platform Dropdown (only for games) */}
        <div className="border-b border-slate-700">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'games' ? 'Search for any game...' : 'Search for players...'}
              className="w-full h-11 pl-11 bg-slate-900 text-white placeholder-slate-400 focus:outline-none transition-all duration-200"
              style={{ paddingRight: searchType === 'games' ? '144px' : '48px' }}
            />
            {isLoading && (
              <Refresh className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
            {/* Platform Dropdown (only for games) */}
            {searchType === 'games' && (
              <div ref={dropdownRef} className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                className="flex items-center gap-1.5 px-2 py-1.5 h-9 bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                {selectedPlatformData && (
                  <>
                    <img 
                      src={selectedPlatformData.icon} 
                      alt={selectedPlatformData.name}
                      className="w-4 h-4"
                      style={{ filter: 'brightness(0) invert(0.7)' }}
                    />
                    <span className="text-xs font-medium">{selectedPlatformData.name}</span>
                  </>
                )}
                <ExpandMore className={`w-4 h-4 transition-transform ${showPlatformDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showPlatformDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 shadow-xl z-[10000] overflow-hidden">
                  {platforms.map((platform) => (
                    <button
                      key={platform.slug}
                      onClick={() => {
                        setSelectedPlatform(platform.slug)
                        setShowPlatformDropdown(false)
                      }}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-left transition-colors
                        ${selectedPlatform === platform.slug
                          ? 'bg-cyan-600/20 text-cyan-400'
                          : 'text-slate-300 hover:bg-slate-700'
                        }
                      `}
                    >
                      <img 
                        src={platform.icon} 
                        alt={platform.name}
                        className="w-4 h-4"
                        style={{ filter: selectedPlatform === platform.slug ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.7)' }}
                      />
                      <span className="text-sm">{platform.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchType === 'games' ? (
            // Games Results
            gameResults.length > 0 ? (
              <div className="divide-y divide-slate-700">
                {gameResults.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleSelect(game)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link
                      href={`/games/${generateSlug(game.name)}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                      className="w-10 h-10 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600/50 hover:border-cyan-500/50 transition-colors"
                    >
                      {game.coverUrl ? (
                        <img src={game.coverUrl} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <SportsEsports className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/games/${generateSlug(game.name)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                        }}
                        className="text-white font-title truncate hover:text-cyan-400 transition-colors block"
                      >
                        {game.name}
                      </Link>
                      {game.lobbyCount !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <People className="w-3 h-3" />
                          <span>{game.lobbyCount} {game.lobbyCount === 1 ? 'lobby' : 'lobbies'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/games/${generateSlug(game.name)}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors duration-200"
                    >
                      View
                    </Link>
                    {game.lobbyCount !== undefined && game.lobbyCount > 0 ? (
                      <Link
                        href={`/games/${generateSlug(game.name)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors duration-200"
                      >
                        JOIN
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => handleQuickMatch(e, game)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-lime-400 text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                        disabled={isCreatingLobby}
                      >
                        {isCreatingLobby ? (
                          <Refresh className="animate-spin w-4 h-4" />
                        ) : (
                          <>
                            <Bolt className="w-4 h-4" />
                            Quick Match
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
            ) : null
          ) : (
            // Players Results
            playerResults.length > 0 ? (
              <div className="divide-y divide-slate-700">
                {playerResults.map((player) => {
                  const borderColor = player.plan_tier === 'founder'
                    ? 'founder'
                    : player.plan_tier === 'pro' &&
                      (!player.plan_expires_at || new Date(player.plan_expires_at) > new Date())
                    ? 'pro'
                    : 'default'

                  return (
                    <Link
                      key={player.id}
                      href={`/u/${player.username || player.id}`}
                      onClick={() => onClose()}
                      className="flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar
                          src={player.avatar_url}
                          alt={player.username || 'Player'}
                          username={player.username}
                          size="md"
                          showBorder
                          borderColor={borderColor}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-title truncate">
                            {player.display_name || player.username}
                          </p>
                          {player.display_name && player.display_name !== player.username && (
                            <p className="text-xs text-slate-400 truncate">@{player.username}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          View Profile
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="p-8 text-center text-slate-400">
                No players found
              </div>
            ) : query.length < 2 ? (
              <div className="p-8 text-center text-slate-400">
                Start typing to search for players...
              </div>
            ) : null
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


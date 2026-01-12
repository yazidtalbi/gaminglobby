'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { CommunityList } from '@/components/CommunityList'
import { GuideList } from '@/components/GuideList'
import { AddCommunityModal } from '@/components/AddCommunityModal'
import { AddGuideModal } from '@/components/AddGuideModal'
import { CreateLobbyModal } from '@/components/CreateLobbyModal'
import { GamePlayersModal } from '@/components/GamePlayersModal'
import { GamePageSkeleton } from '@/components/GamePageSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { SelectCoverModal } from '@/components/SelectCoverModal'
import { Avatar } from '@/components/Avatar'
import { Lobby, GameCommunity, GameGuide, Profile } from '@/types/database'
import { 
  Gamepad2, 
  Users, 
  Plus, 
  Loader2, 
  UserPlus,
  Bookmark,
  Check,
  Monitor,
  Gamepad,
  Clock,
  Edit,
  Zap
} from 'lucide-react'

interface GameDetails {
  id: number
  name: string
  coverUrl: string | null
  coverThumb: string | null
  squareCoverThumb: string | null
  squareCoverUrl: string | null
  heroUrl: string | null
  heroThumb: string | null
}

interface GameDetailClientProps {
  gameIdOrSlug: string
  initialGame: GameDetails | null
}

const platformLabels: Record<string, string> = {
  pc: 'PC',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Mobile',
  other: 'Other',
}

const statusColors: Record<string, string> = {
  open: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

function TimeAgoDisplay({ createdAt }: { createdAt: string }) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    const calculateTimeAgo = () => {
      const seconds = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 1000)
      
      if (seconds < 60) return 'Just now'
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
      return `${Math.floor(seconds / 86400)}d ago`
    }

    setTimeAgo(calculateTimeAgo())
    
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo())
    }, 60000)

    return () => clearInterval(interval)
  }, [createdAt])

  return <span suppressHydrationWarning>{timeAgo || 'Loading...'}</span>
}

export function GameDetailClient({ gameIdOrSlug, initialGame }: GameDetailClientProps) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()

  // Handler to redirect to login if user is not authenticated
  const requireAuth = useCallback((action: () => void) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    action()
  }, [user, router])

  const [game, setGame] = useState<GameDetails | null>(initialGame)
  const [gameError, setGameError] = useState<string | null>(null)
  const [lobbies, setLobbies] = useState<(Lobby & { host?: { username: string; avatar_url: string | null }; member_count?: number })[]>([])
  const [communities, setCommunities] = useState<GameCommunity[]>([])
  const [guides, setGuides] = useState<GameGuide[]>([])
  const [playersCount, setPlayersCount] = useState(0)
  const [searchCount, setSearchCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [players, setPlayers] = useState<Array<Profile & { added_at: string }>>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)
  const [isFounder, setIsFounder] = useState(false)
  const [isQuickMatching, setIsQuickMatching] = useState(false)

  const [showCreateLobby, setShowCreateLobby] = useState(false)
  const [showAddCommunity, setShowAddCommunity] = useState(false)
  const [showAddGuide, setShowAddGuide] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showSelectCover, setShowSelectCover] = useState(false)

  // Fetch game details if not provided initially
  useEffect(() => {
    if (initialGame) return

    const fetchGame = async () => {
      try {
        const isNumeric = /^\d+$/.test(gameIdOrSlug)
        
        let response
        let data
        
        if (isNumeric) {
          response = await fetch(`/api/steamgriddb/game?id=${gameIdOrSlug}`)
          data = await response.json()
          
          if (!data.game && data.error) {
            response = await fetch(`/api/steamgriddb/game?slug=${encodeURIComponent(gameIdOrSlug)}`)
            data = await response.json()
          }
        } else {
          response = await fetch(`/api/steamgriddb/game?slug=${encodeURIComponent(gameIdOrSlug)}`)
          data = await response.json()
        }
        
        let heroUrl: string | null = null
        let heroThumb: string | null = null
        if (data.game && data.game.id) {
          try {
            const heroesResponse = await fetch(`/api/steamgriddb/heroes?gameId=${data.game.id}`)
            const heroesData = await heroesResponse.json()
            if (heroesData.heroes && heroesData.heroes.length > 0) {
              heroUrl = heroesData.heroes[0].url || null
              heroThumb = heroesData.heroes[0].thumb || null
            }
          } catch (heroError) {
            console.error('Failed to fetch heroes:', heroError)
          }
        }

        let selectedCoverUrl: string | null = null
        let selectedCoverThumb: string | null = null
        if (data.game && data.game.id) {
          try {
            const selectedCoverResponse = await fetch(`/api/games/${data.game.id}/selected-cover`)
            const selectedCoverData = await selectedCoverResponse.json()
            if (selectedCoverData.coverUrl) {
              selectedCoverUrl = selectedCoverData.coverUrl
              selectedCoverThumb = selectedCoverData.coverThumb
            }
          } catch (coverError) {
            console.error('Failed to fetch selected cover:', coverError)
          }
        }
        
        if (data.game) {
          setGame({
            ...data.game,
            heroUrl,
            heroThumb,
            squareCoverThumb: data.game.squareCoverThumb || null,
            squareCoverUrl: data.game.squareCoverUrl || null,
            coverUrl: selectedCoverUrl || data.game.coverUrl || null,
            coverThumb: selectedCoverThumb || data.game.coverThumb || null,
          })
          setGameError(null)
        } else if (data.error) {
          const fallbackId = isNumeric ? parseInt(gameIdOrSlug, 10) : 0
          setGame({
            id: fallbackId,
            name: isNumeric ? `Game #${gameIdOrSlug}` : gameIdOrSlug.replace(/-/g, ' '),
            coverUrl: null,
            coverThumb: null,
            squareCoverThumb: null,
            squareCoverUrl: null,
            heroUrl: null,
            heroThumb: null,
          })
          setGameError('Game details unavailable. SteamGridDB API may not be configured.')
        }
      } catch (err) {
        console.error('Failed to fetch game:', err)
      }
    }

    fetchGame()
  }, [gameIdOrSlug, initialGame])

  // Check if game is in user's library
  const checkLibraryStatus = useCallback(async () => {
    if (!user || !game) return

    const { data } = await supabase
      .from('user_games')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', game.id.toString())
      .single()

    setIsInLibrary(!!data)
  }, [user, game, supabase])

  // Fetch lobbies, communities, guides, and stats
  const fetchData = useCallback(async () => {
    if (!game) return
    setIsLoading(true)

    ;(async () => {
      try {
        await supabase.rpc('close_inactive_lobbies')
      } catch {
        // RPC might not exist, ignore errors silently
      }
    })()

    // Fetch lobbies
    const { data: lobbiesData, error: lobbiesError } = await supabase
      .from('lobbies')
      .select(`
        *,
        host:profiles!lobbies_host_id_fkey(username, avatar_url),
        lobby_members(count)
      `)
      .eq('game_id', game.id.toString())
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })

    if (lobbiesError) {
      console.error('Error fetching lobbies:', lobbiesError)
    }

    if (lobbiesData) {
      const mapped = lobbiesData.map((lobby) => {
        const { lobby_members, host, ...rest } = lobby as {
          lobby_members: { count: number }[];
          host: { username: string; avatar_url: string | null } | null;
          [key: string]: unknown;
        };
        return {
          ...rest,
          host: host || undefined,
          member_count: lobby_members?.[0]?.count || 1,
        };
      });
      setLobbies(mapped as typeof lobbies)
    }

    // Fetch communities
    const { data: communitiesData } = await supabase
      .from('game_communities')
      .select('*')
      .eq('game_id', game.id.toString())
      .order('created_at', { ascending: false })

    if (communitiesData) {
      setCommunities(communitiesData)
    }

    // Fetch guides
    const { data: guidesData } = await supabase
      .from('game_guides')
      .select('*')
      .eq('game_id', game.id.toString())
      .order('created_at', { ascending: false })

    if (guidesData) {
      setGuides(guidesData)
    }

    // Fetch players count
    const { count: playersCountData } = await supabase
      .from('user_games')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id.toString())

    setPlayersCount(playersCountData || 0)

    // Fetch search count
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: searchCountData } = await supabase
      .from('game_search_events')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id.toString())
      .gte('created_at', sevenDaysAgo.toISOString())

    setSearchCount(searchCountData || 0)

    setIsLoading(false)
  }, [game, supabase])

  // Fetch players who added the game to their library
  const fetchPlayers = useCallback(async () => {
    if (!game) return
    setIsLoadingPlayers(true)
    
    try {
      const { data: userGames, error } = await supabase
        .from('user_games')
        .select(`
          user_id,
          created_at,
          profile:profiles!user_games_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('game_id', game.id.toString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching players:', error)
        setPlayers([])
        setIsLoadingPlayers(false)
        return
      }

      if (!userGames || userGames.length === 0) {
        setPlayers([])
        setIsLoadingPlayers(false)
        return
      }

      const playersData = userGames
        .map((ug: any) => {
          const profile = ug.profile
          if (!profile) return null

          return {
            ...profile,
            added_at: ug.created_at,
          } as Profile & { added_at: string }
        })
        .filter((p): p is Profile & { added_at: string } => p !== null)

      setPlayers(playersData)
    } catch (error) {
      console.error('Failed to fetch players:', error)
      setPlayers([])
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [game, supabase, user])

  useEffect(() => {
    fetchData()
    fetchPlayers()
  }, [fetchData, fetchPlayers])

  useEffect(() => {
    if (user && game) {
      checkLibraryStatus()
    }
  }, [user, game, checkLibraryStatus])

  useEffect(() => {
    const checkFounderStatus = async () => {
      if (!user || !profile) {
        setIsFounder(false)
        return
      }

      setIsFounder(profile.plan_tier === 'founder')
    }

    checkFounderStatus()
  }, [user, profile])

  const handleToggleLibrary = async () => {
    if (!user || !game || isAddingToLibrary) return

    setIsAddingToLibrary(true)

    try {
      if (isInLibrary) {
        const { error: deleteError } = await supabase
          .from('user_games')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', game.id.toString())

        if (deleteError) {
          console.error('Failed to remove game:', deleteError)
        } else {
          setIsInLibrary(false)
          window.dispatchEvent(new CustomEvent('libraryUpdated'))
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_games')
          .insert({
            user_id: user.id,
            game_id: game.id.toString(),
            game_name: game.name,
          })

        if (insertError) {
          if (insertError.code === '23505') {
            setIsInLibrary(true)
          } else {
            console.error('Failed to add game:', insertError)
          }
        } else {
          setIsInLibrary(true)
          window.dispatchEvent(new CustomEvent('libraryUpdated'))
        }
      }
    } catch (err) {
      console.error('Failed to toggle game in library:', err)
    } finally {
      setIsAddingToLibrary(false)
    }
  }

  const handleQuickMatch = async () => {
    if (!user || !game || !profile || isQuickMatching) return

    setIsQuickMatching(true)

    try {
      const preferredPlatform = (profile as any)?.preferred_platform || 'pc'

      const response = await fetch('/api/lobbies/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id.toString(),
          gameName: game.name,
          platform: preferredPlatform,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Failed to create lobby:', data.error)
        return
      }

      if (data.lobbyId) {
        router.push(`/lobbies/${data.lobbyId}`)
      }
    } catch (err) {
      console.error('Failed to quick match:', err)
    } finally {
      setIsQuickMatching(false)
    }
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    )
  }

  const hasBannerImage = game.heroUrl || game.heroThumb

  return (
    <div className="min-h-screen relative">
      {hasBannerImage && (
        <div className="lg:absolute absolute inset-0 h-48 md:h-56 lg:h-64 w-full overflow-hidden opacity-20 lg:opacity-20">
          <img
            src={game.heroUrl || game.heroThumb || ''}
            alt={`${game.name} game banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 lg:pb-8 relative z-10" style={{ paddingTop: 0, marginTop: 0 }}>
        <div className="hidden lg:block h-10"></div>
        
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-4 mb-3">
            {game.squareCoverThumb || game.squareCoverUrl || game.coverThumb || game.coverUrl ? (
              <div className="relative">
                {isFounder && (
                  <button
                    onClick={() => setShowSelectCover(true)}
                    className="absolute top-1 right-1 z-10 p-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded shadow-lg"
                    title="Edit cover"
                  >
                    <Edit className="w-3 h-3 text-white" />
                  </button>
                )}
                <img
                  src={game.squareCoverThumb || game.squareCoverUrl || game.coverThumb || game.coverUrl || ''}
                  alt={`${game.name} cover art`}
                  className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg object-cover shadow-lg aspect-square"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg bg-slate-800/50 flex items-center justify-center aspect-square">
                <Gamepad2 className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-title text-white leading-tight flex-1 line-clamp-2">{game.name}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPlayersModal(true)}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-sm text-cyan-400 uppercase font-title">{playersCount.toLocaleString()}</span>
              <span className="text-xs text-slate-400 uppercase font-title">PLAYERS</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-cyan-400 uppercase font-title">{searchCount.toLocaleString()}</span>
              <span className="text-xs text-slate-400 uppercase font-title">SEARCHES</span>
            </div>
            {lobbies && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-cyan-400 uppercase font-title">{lobbies.length}</span>
                <span className="text-xs text-slate-400 uppercase font-title">LOBBIES</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden mb-6 flex gap-3">
          <button
            onClick={() => requireAuth(() => handleToggleLibrary())}
            disabled={isAddingToLibrary}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-title text-sm transition-colors relative ${
              isInLibrary
                ? 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400'
                : 'bg-slate-700/50 hover:bg-slate-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
            }`}
          >
            <span className={`absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
            <span className={`absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
            <span className={`absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
            <span className={`absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
            <span className="relative z-10 flex items-center gap-2">
              {isAddingToLibrary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isInLibrary ? 'Removing...' : 'Adding...'}
                </>
              ) : isInLibrary ? (
                <>
                  <Check className="w-4 h-4" />
                  IN LIBRARY
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  ADD TO LIBRARY
                </>
              )}
            </span>
          </button>

          <div className="flex gap-3 flex-1">
            <Link
              href={`/games/${gameIdOrSlug}/find-players`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-title text-sm transition-colors relative border border-cyan-500/30"
            >
              <UserPlus className="w-4 h-4" />
              FIND PLAYERS
            </Link>
            <button
              onClick={() => requireAuth(() => setShowCreateLobby(true))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
            >
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                CREATE LOBBY
              </span>
            </button>

            <button
              onClick={() => requireAuth(() => handleQuickMatch())}
              disabled={isQuickMatching}
              className="flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-lime-400 font-title text-sm transition-colors relative"
            >
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
              <span className="relative z-10">
                {isQuickMatching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <nav className="hidden lg:block mb-4 text-sm" aria-label="Breadcrumb">
              <div className="flex items-center gap-2 text-slate-400 font-title">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link href="/games" className="hover:text-white transition-colors">Games</Link>
                <span>/</span>
                <span className="text-white">{game.name}</span>
              </div>
            </nav>

            <h1 className="hidden lg:block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-title text-white mb-4 leading-tight max-w-xl">{game.name}</h1>

            {gameError && (
              <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                {gameError}
              </div>
            )}

            <section className="mb-8 mt-8 lg:mt-8">
              <h2 className="text-2xl font-title text-white mb-4">Lobbies</h2>
              {isLoading ? (
                <GamePageSkeleton />
              ) : lobbies.length === 0 ? (
                <div className="flex items-center justify-center gap-6 p-6 bg-slate-800/30 border border-slate-700/50">
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm mb-1">No active lobbies</p>
                    <p className="text-slate-500 text-xs">Be the first to create one!</p>
                  </div>
                  {user && (
                    <button
                      onClick={() => setShowCreateLobby(true)}
                      className="hidden lg:flex flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
                    >
                      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        CREATE LOBBY
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/30 border border-slate-700/50">
                  <div className="border-t border-b border-cyan-500/30">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-slate-800/50 border-b border-cyan-500/30 text-xs font-title text-slate-400 uppercase">
                      <div className="col-span-4">Lobby</div>
                      <div className="col-span-2">Platform</div>
                      <div className="col-span-2">Players</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Time</div>
                    </div>
                    <div className="divide-y divide-cyan-500/30">
                      {lobbies.map((lobby) => {
                        const PlatformIcon = lobby.platform === 'pc' ? Monitor : Gamepad
                        return (
                          <Link
                            key={lobby.id}
                            href={`/lobbies/${lobby.id}`}
                            className="grid grid-cols-12 gap-4 p-3 hover:bg-slate-800/30 transition-colors items-center"
                          >
                            <div className="col-span-4 flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 bg-slate-700 flex-shrink-0 flex items-center justify-center">
                                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-title text-sm truncate">{lobby.title}</p>
                                {lobby.host && (
                                  <p className="text-xs text-slate-400 truncate">by {lobby.host.username}</p>
                                )}
                              </div>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 text-slate-300">
                              <PlatformIcon className="w-4 h-4" />
                              <span className="text-sm">{platformLabels[lobby.platform] || 'Other'}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 text-slate-300">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">{lobby.member_count || 1}/{lobby.max_players}</span>
                            </div>
                            <div className="col-span-2">
                              <span className={`px-2 py-1 text-xs font-medium border ${statusColors[lobby.status]}`}>
                                {lobby.status === 'in_progress' ? 'Active' : 'Open'}
                              </span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <TimeAgoDisplay createdAt={lobby.created_at} />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-title text-white">Players</h2>
                <button
                  onClick={() => setShowPlayersModal(true)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-title transition-colors"
                >
                  View Players
                </button>
              </div>
              {isLoadingPlayers ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-slate-800/30 border border-slate-700/50 p-4 space-y-3">
                      <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/30 border border-slate-700/50">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No players have added this game yet</p>
                </div>
              ) : (
                <>
                  <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
                    <div className="flex gap-4 w-max">
                      {players.map((player) => (
                        <Link
                          key={player.id}
                          href={`/u/${player.username || player.id}`}
                          className="bg-slate-800/30 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors flex-shrink-0 min-w-[200px]"
                        >
                          <Avatar
                            src={player.avatar_url}
                            alt={player.display_name || player.username || 'Player'}
                            username={player.username || undefined}
                            size="lg"
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-title text-sm truncate">{player.display_name || player.username}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="hidden lg:grid grid-cols-3 gap-4">
                    {players.slice(0, 6).map((player) => (
                      <Link
                        key={player.id}
                        href={`/u/${player.username}`}
                        className="bg-slate-800/30 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
                      >
                        <Avatar
                          src={player.avatar_url}
                          alt={player.display_name || player.username || 'Player'}
                          username={player.username || undefined}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-title text-sm truncate">{player.display_name || player.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-title text-white">Communities</h2>
                {user && (
                  <button
                    onClick={() => setShowAddCommunity(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50">
                <CommunityList communities={communities} />
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-title text-white">Guides</h2>
                {user && (
                  <button
                    onClick={() => setShowAddGuide(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50">
                <GuideList guides={guides} />
              </div>
            </section>
          </div>

          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              {game.coverUrl || game.coverThumb ? (
                <div className="relative p-2">
                  {isFounder && (
                    <button
                      onClick={() => setShowSelectCover(true)}
                      className="absolute top-4 right-4 z-10 p-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center gap-1.5 text-white text-xs shadow-lg"
                      title="Edit cover"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                  <div className="absolute top-0 left-0 bottom-0 w-px bg-cyan-700" style={{ bottom: '8px' }} />
                  <div className="absolute top-0 right-0 bottom-0 w-px bg-cyan-700" style={{ bottom: '8px' }} />
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-700" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-700" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-700" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-700" />
                  <img
                    src={game.coverThumb || game.coverUrl || ''}
                    alt={`${game.name} cover art`}
                    className="w-full aspect-[2/3] shadow-2xl object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[2/3] bg-slate-800/50 flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-slate-600" />
                </div>
              )}

              <div className="mt-4">
                <div className="border-t border-slate-600/50 mb-4"></div>
                
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setShowPlayersModal(true)}
                    className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer px-4 border-r border-slate-600/50"
                  >
                    <span className="text-sm text-cyan-400 uppercase font-title">{playersCount.toLocaleString()}</span>
                    <span className="text-sm text-white uppercase font-title">PLAYERS</span>
                  </button>
                  <div className="flex flex-col items-center px-4 border-r border-slate-600/50">
                    <span className="text-sm text-cyan-400 uppercase font-title">{searchCount.toLocaleString()}</span>
                    <span className="text-sm text-white uppercase font-title">SEARCHES</span>
                  </div>
                  {lobbies && (
                    <div className="flex flex-col items-center pl-4">
                      <span className="text-sm text-cyan-400 uppercase font-title">{lobbies.length}</span>
                      <span className="text-sm text-white uppercase font-title">LOBBIES</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="mt-4 border-t border-cyan-500/30" />

                <button
                  onClick={() => requireAuth(() => handleToggleLibrary())}
                  disabled={isAddingToLibrary}
                  className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 font-title text-sm transition-colors relative ${
                    isInLibrary
                      ? 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400'
                      : 'bg-slate-700/50 hover:bg-slate-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
                  }`}
                >
                  <span className={`absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
                  <span className={`absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
                  <span className={`absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
                  <span className={`absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
                  <span className="relative z-10 flex items-center gap-2">
                    {isAddingToLibrary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isInLibrary ? 'Removing...' : 'Adding...'}
                      </>
                    ) : isInLibrary ? (
                      <>
                        <Check className="w-4 h-4" />
                        IN LIBRARY
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        ADD TO LIBRARY
                      </>
                    )}
                  </span>
                </button>

                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => requireAuth(() => setShowCreateLobby(true))}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
                  >
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      CREATE LOBBY
                    </span>
                  </button>

                  <button
                    onClick={() => requireAuth(() => handleQuickMatch())}
                    disabled={isQuickMatching}
                    className="flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-lime-400 font-title text-sm transition-colors relative"
                  >
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                    <span className="relative z-10">
                      {isQuickMatching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Is Game Active Section */}
        {game && (
          <section className="mb-8 mt-8 p-6 bg-slate-800/30 border border-slate-700/50">
            <h2 className="text-2xl font-title text-white mb-4">
              Is {game.name} Still Active?
            </h2>
            <div className="space-y-4">
              <p className="text-slate-300 text-base">
                {lobbies.length > 0
                  ? `Yes, ${game.name} is still active! There are currently ${lobbies.length} active ${lobbies.length === 1 ? 'lobby' : 'lobbies'} with players looking for teammates.`
                  : `With Apoxer, yes! While there may not be active lobbies right now, you can create the first one and start matchmaking for ${game.name}.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900/50 p-4 border border-slate-700/50">
                  <div className="text-2xl font-bold text-cyan-400">{lobbies.length}</div>
                  <div className="text-sm text-slate-400">Active Lobbies</div>
                </div>
                <div className="bg-slate-900/50 p-4 border border-slate-700/50">
                  <div className="text-2xl font-bold text-cyan-400">{playersCount}</div>
                  <div className="text-sm text-slate-400">Total Players</div>
                </div>
                <div className="bg-slate-900/50 p-4 border border-slate-700/50">
                  <div className="text-2xl font-bold text-cyan-400">{searchCount}</div>
                  <div className="text-sm text-slate-400">Searches (7 days)</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {game && (
          <section className="mb-8 lg:mb-0">
            <h2 className="text-2xl font-title text-white mb-6">Frequently Asked Questions</h2>
            <div className="bg-slate-800/30 border border-slate-700/50 space-y-4 p-6">
              <div className="border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-title text-white mb-2">
                  Is {game.name} still active?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {lobbies.length > 0
                    ? `Yes, ${game.name} is still active! There are currently ${lobbies.length} active ${lobbies.length === 1 ? 'lobby' : 'lobbies'} with players looking for teammates.`
                    : `With Apoxer, yes! While there may not be active lobbies right now, you can create the first one and start matchmaking for ${game.name}.`}
                </p>
              </div>
              
              <div className="border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-title text-white mb-2">
                  How do I find players for {game.name}?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  You can find players for {game.name} by browsing active lobbies on this page, using the "Find Players" feature, or creating your own lobby. Join the {game.name} community on Apoxer to connect with thousands of players.
                </p>
              </div>

              <div className="border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-title text-white mb-2">
                  How do I create a lobby for {game.name}?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Click the "Create Lobby" button on this page, select your platform, set the number of players, and invite friends or wait for others to join. You can also use Quick Matchmaking to instantly find or create a lobby.
                </p>
              </div>

              <div className="border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-title text-white mb-2">
                  What platforms are supported for {game.name}?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Apoxer supports all major gaming platforms including PC, PlayStation, Xbox, Nintendo Switch, and Mobile. You can filter lobbies by platform to find players on your preferred system.
                </p>
              </div>

              <div className="pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-title text-white mb-2">
                  Is Apoxer free?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Yes, Apoxer is completely free to use. You can browse lobbies, create lobbies, and find players at no cost.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {user && profile && game && (
        <>
          <CreateLobbyModal
            isOpen={showCreateLobby}
            onClose={() => setShowCreateLobby(false)}
            gameId={game.id.toString()}
            gameName={game.name}
            userId={user.id}
            onLobbyCreated={(lobbyId) => {
              router.push(`/lobbies/${lobbyId}`)
            }}
          />
          <AddCommunityModal
            isOpen={showAddCommunity}
            onClose={() => setShowAddCommunity(false)}
            gameId={game.id.toString()}
            gameName={game.name}
            userId={user.id}
            onCommunityAdded={fetchData}
          />
          <AddGuideModal
            isOpen={showAddGuide}
            onClose={() => setShowAddGuide(false)}
            gameId={game.id.toString()}
            gameName={game.name}
            userId={user.id}
            onGuideAdded={fetchData}
          />
        </>
      )}

      {game && (
        <GamePlayersModal
          isOpen={showPlayersModal}
          onClose={() => setShowPlayersModal(false)}
          gameId={game.id.toString()}
        />
      )}

      {game && isFounder && (
        <SelectCoverModal
          isOpen={showSelectCover}
          onClose={() => setShowSelectCover(false)}
          gameId={game.id.toString()}
          gameName={game.name}
          onCoverSelected={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

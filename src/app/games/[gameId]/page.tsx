'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { LobbyCard } from '@/components/LobbyCard'
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
  MessageSquare, 
  BookOpen,
  TrendingUp,
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
    
    // Update every minute to keep it fresh
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo())
    }, 60000)

    return () => clearInterval(interval)
  }, [createdAt])

  return <span suppressHydrationWarning>{timeAgo || 'Loading...'}</span>
}

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const gameIdOrSlug = params.gameId as string
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [game, setGame] = useState<GameDetails | null>(null)
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

  // Fetch game details
  useEffect(() => {
    const fetchGame = async () => {
      try {
        // Check if gameIdOrSlug is a number (ID) or a string (slug)
        const isNumeric = /^\d+$/.test(gameIdOrSlug)
        
        // Try ID first if numeric, then fall back to slug if it fails
        let response
        let data
        
        if (isNumeric) {
          // Try as ID first
          response = await fetch(`/api/steamgriddb/game?id=${gameIdOrSlug}`)
          data = await response.json()
          
          // If ID lookup failed, try as slug
          if (!data.game && data.error) {
            response = await fetch(`/api/steamgriddb/game?slug=${encodeURIComponent(gameIdOrSlug)}`)
            data = await response.json()
          }
        } else {
          // Try as slug
          response = await fetch(`/api/steamgriddb/game?slug=${encodeURIComponent(gameIdOrSlug)}`)
          data = await response.json()
        }
        
        // Fetch heroes for the game
        let heroUrl: string | null = null
        let heroThumb: string | null = null
        if (data.game && data.game.id) {
          try {
            const heroesResponse = await fetch(`/api/steamgriddb/heroes?gameId=${data.game.id}`)
            const heroesData = await heroesResponse.json()
            if (heroesData.heroes && heroesData.heroes.length > 0) {
              // Use the first hero (highest score/quality)
              heroUrl = heroesData.heroes[0].url || null
              heroThumb = heroesData.heroes[0].thumb || null
            }
          } catch (heroError) {
            console.error('Failed to fetch heroes:', heroError)
          }
        }

        // Fetch selected cover (if any)
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
            // Silently fail - selected cover is optional
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
            // Override cover with selected cover if available
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
        } else {
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
          setGameError('Game not found in SteamGridDB.')
        }
      } catch (err) {
        console.error('Failed to fetch game:', err)
        const isNumeric = /^\d+$/.test(gameIdOrSlug)
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
        setGameError('Failed to load game details.')
      }
    }

    fetchGame()
  }, [gameIdOrSlug])

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

    // Close inactive lobbies (non-blocking)
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

    // Fetch players count (users who added the game to their library)
    const { count: playersCountData } = await supabase
      .from('user_games')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id.toString())

    setPlayersCount(playersCountData || 0)

    // Fetch search count (last 7 days)
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
      // Get all players who added this game to their library (same approach as modal)
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

      // Map to Player format
      const playersData = userGames
        .map((ug: any) => {
          const profile = ug.profile
          if (!profile) return null

          return {
            ...profile,
            added_at: ug.created_at, // Date they added the game
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

  // Check if game is in library
  useEffect(() => {
    if (user && game) {
      checkLibraryStatus()
    }
  }, [user, game, checkLibraryStatus])

  // Check if user is founder
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

  // Handle add/remove from library
  const handleToggleLibrary = async () => {
    if (!user || !game || isAddingToLibrary) return

    setIsAddingToLibrary(true)

    try {
      if (isInLibrary) {
        // Remove from library
        const { error: deleteError } = await supabase
          .from('user_games')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', game.id.toString())

        if (deleteError) {
          console.error('Failed to remove game:', deleteError)
        } else {
          setIsInLibrary(false)
          // Trigger instant sidebar update
          window.dispatchEvent(new CustomEvent('libraryUpdated'))
        }
      } else {
        // Add to library
        const { error: insertError } = await supabase
          .from('user_games')
          .insert({
            user_id: user.id,
            game_id: game.id.toString(),
            game_name: game.name,
          })

        if (insertError) {
          if (insertError.code === '23505') {
            // Already in library
            setIsInLibrary(true)
          } else {
            console.error('Failed to add game:', insertError)
          }
        } else {
          setIsInLibrary(true)
          // Trigger instant sidebar update
          window.dispatchEvent(new CustomEvent('libraryUpdated'))
        }
      }
    } catch (err) {
      console.error('Failed to toggle game in library:', err)
    } finally {
      setIsAddingToLibrary(false)
    }
  }

  // Handle quick matchmaking
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
      {/* Hero Banner - Absolute on mobile */}
      {hasBannerImage && (
        <div className="lg:absolute absolute inset-0 h-48 md:h-56 lg:h-64 w-full overflow-hidden opacity-20 lg:opacity-20">
          <img
            src={game.heroUrl || game.heroThumb || ''}
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 lg:pb-8 relative z-10" style={{ paddingTop: 0, marginTop: 0 }}>
        <div className="hidden lg:block h-10"></div>
        {/* Mobile: Cover and Title side by side */}
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
                  alt={game.name}
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
          
          {/* Stats - All in one line, right below title */}
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

        {/* Mobile: Buttons - Side by side */}
        {user && (
          <div className="lg:hidden mb-6 flex gap-3">
            {/* Add/Remove from Library Button */}
            <button
              onClick={handleToggleLibrary}
              disabled={isAddingToLibrary}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-title text-sm transition-colors relative ${
                isInLibrary
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400'
                  : 'bg-slate-700/50 hover:bg-slate-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
              }`}
            >
              {/* Corner brackets */}
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

            {/* Create Lobby and Quick Match Buttons - Side by side */}
            <div className="flex gap-3 flex-1">
              {/* Find Players Link */}
              <Link
                href={`/games/${gameIdOrSlug}/find-players`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-title text-sm transition-colors relative border border-cyan-500/30"
              >
                <UserPlus className="w-4 h-4" />
                FIND PLAYERS
              </Link>
              {/* Create Lobby Button */}
              <button
                onClick={() => setShowCreateLobby(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
              >
                {/* Corner brackets */}
                <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  CREATE LOBBY
                </span>
              </button>

              {/* Quick Matchmaking Button - Icon only */}
              <button
                onClick={handleQuickMatch}
                disabled={isQuickMatching}
                className="flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-lime-400 font-title text-sm transition-colors relative"
              >
                {/* Corner brackets */}
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
        )}

        {/* Compact Layout: Content + Cover side by side */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb - Hidden on mobile */}
            <nav className="hidden lg:block mb-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400 font-title">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link href="/games" className="hover:text-white transition-colors">Games</Link>
                <span>/</span>
                <span className="text-white">{game.name}</span>
              </div>
            </nav>

            {/* Game Title - Large on desktop, hidden on mobile (shown above) */}
            <h1 className="hidden lg:block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-title text-white mb-4 leading-tight max-w-xl">{game.name}</h1>

            {/* Error message */}
            {gameError && (
              <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                {gameError}
              </div>
            )}

            {/* Lobbies Section */}
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
                      {/* Corner brackets */}
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
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 bg-slate-800/50 border-b border-cyan-500/30 text-xs font-title text-slate-400 uppercase">
                      <div className="col-span-4">Lobby</div>
                      <div className="col-span-2">Platform</div>
                      <div className="col-span-2">Players</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Time</div>
                    </div>
                    {/* Table Rows */}
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

            {/* Players Section - Grid on desktop, horizontal scroll on mobile */}
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
                  {/* Mobile: Horizontal Scroll */}
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
                  {/* Desktop: Grid */}
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

            {/* Communities Section */}
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

            {/* Guides Section */}
            <section className="mb-0 lg:mb-8">
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

          {/* Right Side: Cover + Game Info (Desktop only) */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            {/* Cover */}
            <div className="sticky top-24">
              {game.coverUrl || game.coverThumb ? (
                <div className="relative p-2">
                  {/* Edit button (founders only) */}
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
                  {/* Left border */}
                  <div className="absolute top-0 left-0 bottom-0 w-px bg-cyan-700" style={{ bottom: '8px' }} />
                  {/* Right border */}
                  <div className="absolute top-0 right-0 bottom-0 w-px bg-cyan-700" style={{ bottom: '8px' }} />
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-700" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-700" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-700" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-700" />
                  <img
                    src={game.coverThumb || game.coverUrl || ''}
                    alt={game.name}
                    className="w-full aspect-[2/3] shadow-2xl object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[2/3] bg-slate-800/50 flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-slate-600" />
                </div>
              )}

              {/* Stats (below cover) */}
              <div className="mt-4">
                {/* Separator */}
                <div className="border-t border-slate-600/50 mb-4"></div>
                
                {/* Stats grid */}
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

              {/* Buttons (desktop only, below stats) */}
              <div className="mt-4">
                {/* Separator */}
                <div className="mt-4 border-t border-cyan-500/30" />

                {/* Add/Remove from Library Button */}
                {user && (
                  <button
                    onClick={handleToggleLibrary}
                    disabled={isAddingToLibrary}
                    className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 font-title text-sm transition-colors relative ${
                      isInLibrary
                        ? 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                  >
                    {/* Corner brackets */}
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
                )}

                {/* Create Lobby and Quick Match Buttons - Side by side */}
                {user && (
                  <div className="mt-3 flex gap-3">
                    {/* Create Lobby Button */}
                    <button
                      onClick={() => setShowCreateLobby(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
                    >
                      {/* Corner brackets */}
                      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        CREATE LOBBY
                      </span>
                    </button>

                    {/* Quick Matchmaking Button - Icon only */}
                    <button
                      onClick={handleQuickMatch}
                      disabled={isQuickMatching}
                      className="flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-lime-400 font-title text-sm transition-colors relative"
                    >
                      {/* Corner brackets */}
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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

      {/* Players Modal */}
      {game && (
        <GamePlayersModal
          isOpen={showPlayersModal}
          onClose={() => setShowPlayersModal(false)}
          gameId={game.id.toString()}
        />
      )}

      {/* Select Cover Modal */}
      {game && isFounder && (
        <SelectCoverModal
          isOpen={showSelectCover}
          onClose={() => setShowSelectCover(false)}
          gameId={game.id.toString()}
          gameName={game.name}
          onCoverSelected={() => {
            // Reload the game data to show the new cover
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

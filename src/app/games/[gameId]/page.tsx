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
import { FollowButton } from '@/components/FollowButton'
import { CRTCoverImage } from '@/components/CRTCoverImage'
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
  Clock
} from 'lucide-react'

interface GameDetails {
  id: number
  name: string
  coverUrl: string | null
  coverThumb: string | null
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

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
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
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)

  const [showCreateLobby, setShowCreateLobby] = useState(false)
  const [showAddCommunity, setShowAddCommunity] = useState(false)
  const [showAddGuide, setShowAddGuide] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)

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
        
        if (data.game) {
          setGame({
            ...data.game,
            heroUrl,
            heroThumb,
          })
          setGameError(null)
        } else if (data.error) {
          const fallbackId = isNumeric ? parseInt(gameIdOrSlug, 10) : 0
          setGame({
            id: fallbackId,
            name: isNumeric ? `Game #${gameIdOrSlug}` : gameIdOrSlug.replace(/-/g, ' '),
            coverUrl: null,
            coverThumb: null,
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
          profile:profiles!user_games_user_id_fkey(id, username, avatar_url, bio)
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

      // Fetch following status for all players
      if (user && playersData.length > 0) {
        const playerIds = playersData.map(p => p.id)
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', playerIds)

        const following: Record<string, boolean> = {}
        if (followsData) {
          followsData.forEach(f => {
            following[f.following_id] = true
          })
        }
        setFollowingMap(following)
      }
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


  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    )
  }

  const hasBannerImage = game.heroUrl || game.heroThumb

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      {hasBannerImage && (
        <div className="relative h-48 md:h-56 lg:h-64 w-full overflow-hidden opacity-15">
          <img
            src={game.heroUrl || game.heroThumb || ''}
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900   to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -top-60 relative -mb-60">
        {/* Compact Layout: Content + Cover side by side */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav className="mt-0 mb-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400 font-title">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link href="/games" className="hover:text-white transition-colors">Games</Link>
                <span>/</span>
                <span className="text-white">{game.name}</span>
              </div>
            </nav>

            {/* Game Title */}
            <h1 className="text-5xl lg:text-6xl font-title text-white mb-4 leading-tight max-w-xl">{game.name}</h1>

            {/* Error message */}
            {gameError && (
              <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                {gameError}
              </div>
            )}

            {/* Lobbies Section */}
            <section className="mb-8 mt-8">
              <h2 className="text-2xl font-title text-white mb-4">Lobbies</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : lobbies.length === 0 ? (
                <div className="flex items-center justify-center gap-6 p-6 bg-slate-800/30 border border-slate-700/50">
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm mb-1">No active lobbies</p>
                    <p className="text-slate-500 text-xs">Be the first to create one!</p>
                  </div>
                  {user && (
                    <button
                      onClick={() => setShowCreateLobby(true)}
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
                    >
                      {/* Corner brackets */}
                      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        &gt; CREATE LOBBY
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
                        const timeAgo = getTimeAgo(new Date(lobby.created_at))
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
                              <span>{timeAgo}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Players Section */}
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
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/30 border border-slate-700/50">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No players have added this game yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {players.slice(0, 6).map((player) => (
                    <div key={player.id} className="bg-slate-800/30 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors">
                      <Link href={`/u/${player.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={player.avatar_url || '/default-avatar.png'}
                          alt={player.username}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-title text-sm truncate">{player.username}</p>
                          {player.bio && (
                            <p className="text-xs text-slate-400 truncate">{player.bio}</p>
                          )}
                        </div>
                      </Link>
                      {user && user.id !== player.id && (
                        <FollowButton
                          targetUserId={player.id}
                          currentUserId={user.id}
                          initialIsFollowing={followingMap[player.id] || false}
                          onFollowChange={(isFollowing) => {
                            setFollowingMap(prev => ({
                              ...prev,
                              [player.id]: isFollowing
                            }))
                          }}
                          className="flex-shrink-0"
                        />
                      )}
                    </div>
                  ))}
                </div>
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

          {/* Right Side: Cover + Game Info */}
          <div className="lg:w-64 flex-shrink-0">
            {/* Cover */}
            <div className="sticky top-24">
              {game.coverUrl || game.coverThumb ? (
                <div className="relative p-2">
                  {/* Left border */}
                  <div className="absolute top-0 left-0 bottom-0 w-px bg-cyan-700" style={{ bottom: '8px' }} />
                  {/* Right border */}
                  <div className="absolute top-0 right-0 bottom-0 w-px bg-cyan-700" style={{ bottom: '8px' }} />
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-700" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-700" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-700" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-700" />
                  <CRTCoverImage
                    src={game.coverThumb || game.coverUrl || ''}
                    alt={game.name}
                    className="w-full aspect-[2/3] shadow-2xl"
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
              <div className="hidden lg:block mt-4">
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
                          &gt; IN LIBRARY
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          &gt; ADD TO LIBRARY
                        </>
                      )}
                    </span>
                  </button>
                )}

                {/* Create Lobby Button */}
                {user && (
                  <button
                    onClick={() => setShowCreateLobby(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
                  >
                    {/* Corner brackets */}
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      &gt; CREATE LOBBY
                    </span>
                  </button>
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
    </div>
  )
}

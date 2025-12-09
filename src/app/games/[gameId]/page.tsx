'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { LobbyCard } from '@/components/LobbyCard'
import { CommunityList } from '@/components/CommunityList'
import { GuideList } from '@/components/GuideList'
import { AddCommunityModal } from '@/components/AddCommunityModal'
import { AddGuideModal } from '@/components/AddGuideModal'
import { CreateLobbyModal } from '@/components/CreateLobbyModal'
import { Lobby, GameCommunity, GameGuide } from '@/types/database'
import { 
  Gamepad2, 
  Users, 
  Plus, 
  Loader2, 
  MessageSquare, 
  BookOpen,
  TrendingUp,
  UserPlus
} from 'lucide-react'

interface GameDetails {
  id: number
  name: string
  coverUrl: string | null
  coverThumb: string | null
}

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
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

  const [showCreateLobby, setShowCreateLobby] = useState(false)
  const [showAddCommunity, setShowAddCommunity] = useState(false)
  const [showAddGuide, setShowAddGuide] = useState(false)

  // Fetch game details
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`/api/steamgriddb/game?id=${gameId}`)
        const data = await response.json()
        if (data.game) {
          setGame(data.game)
          setGameError(null)
        } else if (data.error) {
          // API returned an error - create placeholder game
          setGame({
            id: parseInt(gameId, 10),
            name: `Game #${gameId}`,
            coverUrl: null,
            coverThumb: null,
          })
          setGameError('Game details unavailable. SteamGridDB API may not be configured.')
        } else {
          setGame({
            id: parseInt(gameId, 10),
            name: `Game #${gameId}`,
            coverUrl: null,
            coverThumb: null,
          })
          setGameError('Game not found in SteamGridDB.')
        }
      } catch (err) {
        console.error('Failed to fetch game:', err)
        // Even on error, allow the page to work with a placeholder
        setGame({
          id: parseInt(gameId, 10),
          name: `Game #${gameId}`,
          coverUrl: null,
          coverThumb: null,
        })
        setGameError('Failed to load game details.')
      }
    }

    fetchGame()
  }, [gameId])

  // Fetch lobbies, communities, guides, and stats
  const fetchData = useCallback(async () => {
    setIsLoading(true)

    // Close inactive lobbies (non-blocking, fire and forget)
    // Supabase RPC returns {data, error}, not a standard Promise with .catch()
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
      .eq('game_id', gameId)
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
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })

    if (communitiesData) {
      setCommunities(communitiesData)
    }

    // Fetch guides
    const { data: guidesData } = await supabase
      .from('game_guides')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })

    if (guidesData) {
      setGuides(guidesData)
    }

    // Fetch players count
    const { count: playersCountData } = await supabase
      .from('user_games')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    setPlayersCount(playersCountData || 0)

    // Fetch search count (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: searchCountData } = await supabase
      .from('game_search_events')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .gte('created_at', sevenDaysAgo.toISOString())

    setSearchCount(searchCountData || 0)

    setIsLoading(false)
  }, [gameId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Game Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover */}
          <div className="w-48 flex-shrink-0 mx-auto md:mx-0">
            {game.coverUrl || game.coverThumb ? (
              <img
                src={game.coverThumb || game.coverUrl || ''}
                alt={game.name}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-slate-800 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-16 h-16 text-slate-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{game.name}</h1>

            {/* Error message */}
            {gameError && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                {gameError}
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium">{playersCount}</span>
                <span className="text-slate-400 text-sm">players</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">{searchCount}</span>
                <span className="text-slate-400 text-sm">searches this week</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-medium">{lobbies.length}</span>
                <span className="text-slate-400 text-sm">active lobbies</span>
              </div>
            </div>

            {/* Actions */}
            {user && (
              <button
                onClick={() => setShowCreateLobby(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Lobby
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Lobbies - Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Active Lobbies
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : lobbies.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No active lobbies</p>
                <p className="text-sm text-slate-500 mb-4">Be the first to create one!</p>
                {user && (
                  <button
                    onClick={() => setShowCreateLobby(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Lobby
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {lobbies.map((lobby) => (
                  <LobbyCard key={lobby.id} lobby={lobby} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Communities */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Communities
                </h3>
                {user && (
                  <button
                    onClick={() => setShowAddCommunity(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <CommunityList communities={communities} />
            </div>

            {/* Guides */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Guides
                </h3>
                {user && (
                  <button
                    onClick={() => setShowAddGuide(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <GuideList guides={guides} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {user && profile && (
        <>
          <CreateLobbyModal
            isOpen={showCreateLobby}
            onClose={() => setShowCreateLobby(false)}
            gameId={gameId}
            gameName={game.name}
            userId={user.id}
            onLobbyCreated={(lobbyId) => {
              router.push(`/lobbies/${lobbyId}`)
            }}
          />
          <AddCommunityModal
            isOpen={showAddCommunity}
            onClose={() => setShowAddCommunity(false)}
            gameId={gameId}
            gameName={game.name}
            userId={user.id}
            onCommunityAdded={fetchData}
          />
          <AddGuideModal
            isOpen={showAddGuide}
            onClose={() => setShowAddGuide(false)}
            gameId={gameId}
            gameName={game.name}
            userId={user.id}
            onGuideAdded={fetchData}
          />
        </>
      )}
    </div>
  )
}


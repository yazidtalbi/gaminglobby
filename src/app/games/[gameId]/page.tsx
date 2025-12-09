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

type TabType = 'lobbies' | 'communities' | 'guides'

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
  const [activeTab, setActiveTab] = useState<TabType>('lobbies')

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

  const tabs = [
    { id: 'lobbies' as const, label: 'Lobbies', icon: Users, count: lobbies.length, color: 'text-emerald-400' },
    { id: 'communities' as const, label: 'Communities', icon: MessageSquare, count: communities.length, color: 'text-indigo-400' },
    { id: 'guides' as const, label: 'Guides', icon: BookOpen, count: guides.length, color: 'text-amber-400' },
  ]

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Layout: Cover + Content side by side */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Cover + Game Info */}
          <div className="lg:w-64 flex-shrink-0">
            {/* Cover */}
            <div className="sticky top-24">
              {game.coverUrl || game.coverThumb ? (
                <img
                  src={game.coverThumb || game.coverUrl || ''}
                  alt={game.name}
                  className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border border-slate-700/50"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/50">
                  <Gamepad2 className="w-16 h-16 text-slate-600" />
                </div>
              )}

              {/* Game Title (mobile hidden, shown on desktop below cover) */}
              <div className="hidden lg:block mt-4">
                <h1 className="text-xl font-bold text-white leading-tight">{game.name}</h1>
                
                {/* Mini Stats */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">{playersCount} players</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300">{searchCount} searches</span>
                  </div>
                </div>

                {/* Create Lobby Button */}
                {user && (
                  <button
                    onClick={() => setShowCreateLobby(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Lobby
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile: Game Title + Stats */}
            <div className="lg:hidden mb-4">
              <h1 className="text-2xl font-bold text-white mb-3">{game.name}</h1>
              
              {gameError && (
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                  {gameError}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">{playersCount} players</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300">{searchCount} searches</span>
                </div>
              </div>

              {user && (
                <button
                  onClick={() => setShowCreateLobby(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Lobby
                </button>
              )}
            </div>

            {/* Desktop: Error message */}
            {gameError && (
              <div className="hidden lg:block mb-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                {gameError}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-slate-700/50">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-slate-800/50 text-white border-b-2 border-emerald-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`
                          px-1.5 py-0.5 text-xs rounded-full
                          ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}
                        `}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {/* Lobbies Tab */}
                {activeTab === 'lobbies' && (
                  <div>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                      </div>
                    ) : lobbies.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm mb-1">No active lobbies</p>
                        <p className="text-slate-500 text-xs mb-3">Be the first to create one!</p>
                        {user && (
                          <button
                            onClick={() => setShowCreateLobby(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create Lobby
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {lobbies.map((lobby) => (
                          <LobbyCard key={lobby.id} lobby={lobby} compact />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Communities Tab */}
                {activeTab === 'communities' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Discord & Social Links</span>
                      {user && (
                        <button
                          onClick={() => setShowAddCommunity(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      )}
                    </div>
                    <CommunityList communities={communities} />
                  </div>
                )}

                {/* Guides Tab */}
                {activeTab === 'guides' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Player Guides & Resources</span>
                      {user && (
                        <button
                          onClick={() => setShowAddGuide(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      )}
                    </div>
                    <GuideList guides={guides} />
                  </div>
                )}
              </div>
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

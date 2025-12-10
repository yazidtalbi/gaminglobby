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
  UserPlus,
  Bookmark,
  Check
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
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)

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

  // Check if game is in user's library
  const checkLibraryStatus = useCallback(async () => {
    if (!user || !game) return

    const { data } = await supabase
      .from('user_games')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .single()

    setIsInLibrary(!!data)
  }, [user, gameId, supabase, game])

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
          .eq('game_id', gameId)

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
            game_id: gameId,
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

  const tabs = [
    { id: 'lobbies' as const, label: 'Lobbies', icon: Users, count: lobbies.length, color: 'text-lime-400' },
    { id: 'communities' as const, label: 'Communities', icon: MessageSquare, count: communities.length, color: 'text-indigo-400' },
    { id: 'guides' as const, label: 'Guides', icon: BookOpen, count: guides.length, color: 'text-amber-400' },
  ]

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
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
                <div className="relative p-2">
                  {/* Left border */}
                  <div className="absolute top-0 left-0 bottom-0 w-px bg-cyan-500" style={{ bottom: '8px' }} />
                  {/* Right border */}
                  <div className="absolute top-0 right-0 bottom-0 w-px bg-cyan-500" style={{ bottom: '8px' }} />
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500" />
                  <span className="absolute bottom-[8px] left-0 w-2 h-2 border-b border-l border-cyan-500" />
                  <span className="absolute bottom-[8px] right-0 w-2 h-2 border-b border-r border-cyan-500" />
                  <img
                    src={game.coverThumb || game.coverUrl || ''}
                    alt={game.name}
                    className="w-full aspect-[2/3] object-cover shadow-2xl"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[2/3] bg-slate-800/50 flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-slate-600" />
                </div>
              )}

              {/* Game Title (mobile hidden, shown on desktop below cover) */}
              <div className="hidden lg:block mt-4">
                <h1 className="text-xl font-title text-white leading-tight">{game.name}</h1>
                
                    {/* Mini Stats */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 border border-slate-700 px-2 py-1">
                          <span className="text-lg font-bold text-white">{playersCount}</span>
                        </div>
                        <span className="text-sm text-white uppercase font-title">Players</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 border border-slate-700 px-2 py-1">
                          <span className="text-lg font-bold text-white">{searchCount}</span>
                        </div>
                        <span className="text-sm text-white uppercase font-title">Searches</span>
                      </div>
                    </div>

                {/* Add/Remove from Library Button */}
                {user && (
                  <button
                    onClick={handleToggleLibrary}
                    disabled={isAddingToLibrary}
                    className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 font-title text-sm transition-colors relative ${
                      isInLibrary
                        ? 'bg-slate-700/50 hover:bg-slate-700 text-lime-400'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                  >
                    {/* Corner brackets */}
                    <span className={`absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
                    <span className={`absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
                    <span className={`absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
                    <span className={`absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
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

          {/* Right Side: Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile: Game Title + Stats */}
            <div className="lg:hidden mb-4">
              <h1 className="text-2xl font-title text-white mb-3">{game.name}</h1>
              
              {gameError && (
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                  {gameError}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 border border-slate-700 px-2 py-1">
                    <span className="text-lg font-bold text-white">{playersCount}</span>
                  </div>
                  <span className="text-sm text-white uppercase font-title">Players</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 border border-slate-700 px-2 py-1">
                    <span className="text-lg font-bold text-white">{searchCount}</span>
                  </div>
                  <span className="text-sm text-white uppercase font-title">Searches</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {user && (
                  <button
                    onClick={handleToggleLibrary}
                    disabled={isAddingToLibrary}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-title text-sm transition-colors relative ${
                      isInLibrary
                        ? 'bg-slate-700/50 hover:bg-slate-700 text-lime-400'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                  >
                    {/* Corner brackets */}
                    <span className={`absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
                    <span className={`absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
                    <span className={`absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
                    <span className={`absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r ${isInLibrary ? 'border-lime-400' : 'border-fuchsia-400'}`} />
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
                {user && (
                  <button
                    onClick={() => setShowCreateLobby(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
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

            {/* Desktop: Error message */}
            {gameError && (
              <div className="hidden lg:block mb-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                {gameError}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-slate-800/30 border border-cyan-500/30 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-cyan-500/30">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-3 px-4 py-4 text-sm font-title transition-all relative
                        ${isActive 
                          ? 'bg-slate-800/50 text-cyan-400' 
                          : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30'
                        }
                      `}
                    >
                      {/* Icon with number - no border/padding on icon */}
                      <div className="relative flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-cyan-500/70'}`} />
                        {tab.count > 0 && (
                          <span className={`
                            text-base font-title
                            ${isActive 
                              ? 'text-cyan-400' 
                              : 'text-cyan-500/70'
                            }
                          `}>
                            {tab.count}
                          </span>
                        )}
                      </div>
                      <span className="hidden sm:inline ml-2 text-base font-title">{tab.label}</span>
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
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
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
                      <span className="text-xs text-slate-500 font-title">Discord & Social Links</span>
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
                      <span className="text-xs text-slate-500 font-title">Player Guides & Resources</span>
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

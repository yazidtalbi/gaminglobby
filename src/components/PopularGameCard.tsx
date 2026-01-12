'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gamepad2, Users, RefreshCw, Bolt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'

interface PopularGameCardProps {
  gameId: string
  gameName: string
  gameCoverUrl: string | null
  totalPlayers: number
  onlinePlayers: number
  activeLobbies: number
  lobbies: Array<{
    id: string
    title: string
    created_at: string
    max_players: number | null
    member_count: number
    host?: {
      username: string
      avatar_url: string | null
    } | null
  }>
}

export function PopularGameCard({
  gameId,
  gameName,
  gameCoverUrl,
  totalPlayers,
  onlinePlayers,
  activeLobbies,
  lobbies,
}: PopularGameCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentLobbies, setCurrentLobbies] = useState(lobbies)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Fetch fresh lobbies for this game
      const { data: freshLobbies } = await supabase
        .from('lobbies')
        .select(`
          id,
          title,
          created_at,
          max_players,
          host:profiles!lobbies_host_id_fkey(username, avatar_url)
        `)
        .eq('game_id', gameId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(3)

      if (freshLobbies) {
        const lobbyIds = freshLobbies.map(l => l.id)
        const { data: memberCounts } = await supabase
          .from('lobby_members')
          .select('lobby_id')
          .in('lobby_id', lobbyIds)

        const counts: Record<string, number> = {}
        memberCounts?.forEach(m => {
          counts[m.lobby_id] = (counts[m.lobby_id] || 0) + 1
        })

        const lobbiesWithCounts = freshLobbies.map(lobby => ({
          id: lobby.id,
          title: lobby.title,
          created_at: lobby.created_at,
          max_players: lobby.max_players,
          member_count: counts[lobby.id] || 1,
          host: Array.isArray(lobby.host) ? (lobby.host[0] || null) : (lobby.host || null),
        }))

        setCurrentLobbies(lobbiesWithCounts)
      }
    } catch (error) {
      console.error('Failed to refresh lobbies:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleQuickLobby = async () => {
    if (!user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/app'
      router.push(`/auth/login?next=${encodeURIComponent(currentPath)}`)
      return
    }

    try {
      const response = await fetch('/api/lobbies/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          gameName,
          platform: 'pc',
          userId: user.id,
        }),
      })

      const data = await response.json()
      if (data.lobbyId) {
        router.push(`/lobbies/${data.lobbyId}`)
      }
    } catch (error) {
      console.error('Failed to create quick lobby:', error)
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 p-6">
      <div className="flex gap-6">
        {/* Game Image - Left Side */}
        <div className="w-40 h-48 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600/50">
          {gameCoverUrl ? (
            <img src={gameCoverUrl} alt={gameName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-slate-600" />
            </div>
          )}
        </div>

        {/* All Content - Right Side */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Game Header */}
          <div className="mb-4">
            <h3 className="font-title text-white text-xl mb-3">{gameName}</h3>
            <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {totalPlayers} players
              </span>
              <span className="text-cyan-400">{onlinePlayers} online</span>
            </div>

            {/* Quick Lobby Button */}
            <button
              onClick={handleQuickLobby}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
            >
              <Bolt className="w-4 h-4" />
              Quick Lobby
            </button>
          </div>

          {/* Lobbies List */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-medium">
                Active Lobbies ({activeLobbies})
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                title="Refresh lobbies"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {currentLobbies.length > 0 ? (
              <div className="space-y-2">
                {currentLobbies.map((lobby) => (
                  <Link
                    key={lobby.id}
                    href={`/lobbies/${lobby.id}`}
                    className="block p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium mb-1">{lobby.title}</p>
                        <p className="text-xs text-slate-400">
                          {lobby.member_count}
                          {lobby.max_players ? `/${lobby.max_players}` : ''} players
                          {' • '}
                          {formatDistanceToNow(new Date(lobby.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                No active lobbies
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


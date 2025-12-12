'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { OnlineIndicatorDot } from '@/components/OnlineIndicator'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface RecentPlayer {
  id: string
  username: string
  avatar_url: string | null
  last_active_at: string
  last_encountered_at: string
  lobby_id: string | null
  plan_tier?: string | null
  plan_expires_at?: string | null
}

export function RecentPlayersSidebar() {
  const { user } = useAuth()
  const supabase = createClient()
  const [players, setPlayers] = useState<RecentPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    fetchRecentPlayers()

    // Subscribe to changes
    const channel = supabase
      .channel('recent_players_sidebar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recent_players',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRecentPlayers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const fetchRecentPlayers = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data: recentPlayersData } = await supabase
        .from('recent_players')
        .select(`
          encountered_player_id,
          last_encountered_at,
          lobby_id,
          profile:profiles!recent_players_encountered_player_id_fkey(id, username, avatar_url, last_active_at, plan_tier, plan_expires_at)
        `)
        .eq('user_id', user.id)
        .order('last_encountered_at', { ascending: false })
        .limit(10)

      if (!recentPlayersData) {
        setIsLoading(false)
        return
      }

      const formattedPlayers: RecentPlayer[] = recentPlayersData.map((rp) => {
        const profile = rp.profile as any
        return {
          id: profile.id,
          username: profile.username || 'Unknown',
          avatar_url: profile.avatar_url || null,
          last_active_at: profile.last_active_at || new Date().toISOString(),
          last_encountered_at: rp.last_encountered_at,
          lobby_id: rp.lobby_id,
          plan_tier: profile.plan_tier || null,
          plan_expires_at: profile.plan_expires_at || null,
        }
      })

      setPlayers(formattedPlayers)
    } catch (err) {
      console.error('Failed to fetch recent players:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!user) {
    return null
  }

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 sticky top-24">
        <div className="mb-4">
          <h2 className="text-lg font-title text-white mb-1">Recent Players</h2>
          <p className="text-xs text-slate-400">Players you've encountered</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No recent players yet</p>
            <p className="text-xs text-slate-600 mt-1">Join a lobby to meet players!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/u/${player.username || player.id}`}
                className="flex items-center gap-3 p-2 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-cyan-500/50 hover:bg-slate-900 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full overflow-hidden bg-slate-700 border ${
                    player.plan_tier === 'founder'
                      ? 'border-purple-400'
                      : player.plan_tier === 'pro' && 
                        (!player.plan_expires_at || new Date(player.plan_expires_at) > new Date())
                        ? 'border-yellow-400' 
                        : 'border-slate-600'
                  }`}>
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <span className="text-sm text-white font-title">
                          {player.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <OnlineIndicatorDot lastActiveAt={player.last_active_at} size="sm" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-title text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
                    {player.username}
                  </p>
                  <p className="text-xs text-slate-400">
                    {getTimeAgo(player.last_encountered_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {players.length > 0 && (
          <Link
            href="/recent-players"
            className="block mt-4 text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all →
          </Link>
        )}
      </div>
    </div>
  )
}


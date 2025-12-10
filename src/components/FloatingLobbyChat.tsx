'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { LobbyChat } from './LobbyChat'
import { ChevronUp, ChevronDown, Gamepad2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface LobbyInfo {
  id: string
  title: string
  game_id: string
  game_name: string
  status: string
  iconUrl?: string | null
}

export function FloatingLobbyChat() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [lobby, setLobby] = useState<LobbyInfo | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isHidden, setIsHidden] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Hide on lobby pages and settings page
  const isOnLobbyPage = pathname?.startsWith('/lobbies/')
  const isOnSettingsPage = pathname === '/settings'

  // Check if user has hidden the widget
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkHidden = () => {
        const hidden = localStorage.getItem('floating_lobby_chat_hidden')
        setIsHidden(hidden === 'true')
      }
      
      checkHidden()
      
      // Listen for storage changes (when settings are updated)
      window.addEventListener('storage', checkHidden)
      
      // Also check periodically (for same-tab updates)
      const interval = setInterval(checkHidden, 500)
      
      return () => {
        window.removeEventListener('storage', checkHidden)
        clearInterval(interval)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchCurrentLobby = async () => {
      setLoading(true)

      // First check if user is hosting a lobby
      const { data: hostedLobby } = await supabase
        .from('lobbies')
        .select('*')
        .eq('host_id', user.id)
        .in('status', ['open', 'in_progress'])
        .single()

      if (hostedLobby) {
        // Fetch game icon (square cover)
        let iconUrl = null
        try {
          const res = await fetch(`/api/steamgriddb/game?id=${hostedLobby.game_id}`)
          const data = await res.json()
          iconUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
        } catch {}

        setLobby({
          id: hostedLobby.id,
          title: hostedLobby.title,
          game_id: hostedLobby.game_id,
          game_name: hostedLobby.game_name,
          status: hostedLobby.status,
          iconUrl,
        })
        setLoading(false)
        return
      }

      // If not hosting, check if member of a lobby
      const { data: memberData } = await supabase
        .from('lobby_members')
        .select(`
          lobby:lobbies!inner(*)
        `)
        .eq('user_id', user.id)
        .single()

      if (memberData?.lobby) {
        const lobbyInfo = memberData.lobby as {
          id: string
          title: string
          game_id: string
          game_name: string
          status: string
        }

        if (lobbyInfo.status === 'open' || lobbyInfo.status === 'in_progress') {
          // Fetch game icon (square cover)
          let iconUrl = null
          try {
            const res = await fetch(`/api/steamgriddb/game?id=${lobbyInfo.game_id}`)
            const data = await res.json()
            iconUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
          } catch {}

          setLobby({
            id: lobbyInfo.id,
            title: lobbyInfo.title,
            game_id: lobbyInfo.game_id,
            game_name: lobbyInfo.game_name,
            status: lobbyInfo.status,
            iconUrl,
          })
        }
      }

      setLoading(false)
    }

    fetchCurrentLobby()

    // Subscribe to lobby changes
    const channel = supabase
      .channel('floating-lobby-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobbies',
          filter: `host_id=eq.${user.id}`,
        },
        () => {
          fetchCurrentLobby()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCurrentLobby()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Hide if on lobby page, settings page, no lobby, or user has hidden it
  if (loading || !user || !lobby || isOnLobbyPage || isOnSettingsPage || isHidden) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        // Compact view
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl hover:bg-slate-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded overflow-hidden bg-slate-700 border border-slate-600 flex-shrink-0">
            {lobby.iconUrl ? (
              <img
                src={lobby.iconUrl}
                alt={lobby.game_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white/50" />
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white group-hover:text-app-green-400 transition-colors">
              {lobby.title}
            </p>
            <p className="text-xs text-slate-400">{lobby.game_name}</p>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      ) : (
        // Expanded view with chat
        <div className="w-96 h-[600px] bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800/50">
            <div className="w-10 h-10 rounded overflow-hidden bg-slate-700 border border-slate-600 flex-shrink-0">
              {lobby.iconUrl ? (
                <img
                  src={lobby.iconUrl}
                  alt={lobby.game_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white/50" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{lobby.title}</p>
              <p className="text-xs text-slate-400 truncate">{lobby.game_name}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={`/lobbies/${lobby.id}`}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Open lobby page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden p-3">
            <div className="h-full">
              <LobbyChat lobbyId={lobby.id} currentUserId={user.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


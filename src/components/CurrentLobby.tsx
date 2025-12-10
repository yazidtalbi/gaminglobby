'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Users, Crown, Clock, Monitor, Gamepad, ExternalLink, Loader2 } from 'lucide-react'

interface LobbyInfo {
  id: string
  title: string
  game_id: string
  game_name: string
  platform: string
  status: string
  host_id: string
  max_players: number | null
  created_at: string
  member_count?: number
  coverUrl?: string | null
}

interface CurrentLobbyProps {
  userId: string
  isOwnProfile?: boolean
}

const platformIcons: Record<string, React.ReactNode> = {
  pc: <Monitor className="w-4 h-4" />,
  ps: <Gamepad className="w-4 h-4" />,
  xbox: <Gamepad className="w-4 h-4" />,
  switch: <Gamepad className="w-4 h-4" />,
  mobile: <Gamepad className="w-4 h-4" />,
  other: <Gamepad className="w-4 h-4" />,
}

export function CurrentLobby({ userId, isOwnProfile = false }: CurrentLobbyProps) {
  const [lobby, setLobby] = useState<LobbyInfo | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchCurrentLobby = async () => {
      setLoading(true)

      // First check if user is hosting a lobby
      const { data: hostedLobby } = await supabase
        .from('lobbies')
        .select(`
          *,
          lobby_members(count)
        `)
        .eq('host_id', userId)
        .in('status', ['open', 'in_progress'])
        .single()

      if (hostedLobby) {
        const lobbyData = hostedLobby as {
          lobby_members: { count: number }[];
          [key: string]: unknown;
        }
        
        // Fetch game cover
        let coverUrl = null
        try {
          const res = await fetch(`/api/steamgriddb/game?id=${hostedLobby.game_id}`)
          const data = await res.json()
          coverUrl = data.game?.coverThumb || data.game?.coverUrl || null
        } catch {}

        setLobby({
          ...hostedLobby,
          member_count: lobbyData.lobby_members?.[0]?.count || 1,
          coverUrl,
        } as LobbyInfo)
        setIsHost(true)
        setLoading(false)
        return
      }

      // If not hosting, check if member of a lobby
      const { data: memberData } = await supabase
        .from('lobby_members')
        .select(`
          lobby:lobbies!inner(
            *,
            lobby_members(count)
          )
        `)
        .eq('user_id', userId)
        .single()

      if (memberData?.lobby) {
        const lobbyInfo = memberData.lobby as unknown as {
          id: string;
          title: string;
          game_id: string;
          game_name: string;
          platform: string;
          status: string;
          host_id: string;
          max_players: number | null;
          created_at: string;
          lobby_members: { count: number }[];
        }

        if (lobbyInfo.status === 'open' || lobbyInfo.status === 'in_progress') {
          // Fetch game cover
          let coverUrl = null
          try {
            const res = await fetch(`/api/steamgriddb/game?id=${lobbyInfo.game_id}`)
            const data = await res.json()
            coverUrl = data.game?.coverThumb || data.game?.coverUrl || null
          } catch {}

          setLobby({
            ...lobbyInfo,
            member_count: lobbyInfo.lobby_members?.[0]?.count || 1,
            coverUrl,
          })
          setIsHost(lobbyInfo.host_id === userId)
        }
      }

      setLoading(false)
    }

    fetchCurrentLobby()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="border border-cyan-500/30 overflow-hidden">
        <div className="bg-slate-800/50 p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!lobby) {
    return null // Don't show section if not in a lobby
  }

  const timeAgo = getTimeAgo(new Date(lobby.created_at))

  return (
    <div className="border border-cyan-500/30 overflow-hidden">
      {/* Header with full background */}
      <div className="bg-cyan-400 px-4 py-3">
        <div className="flex items-center gap-2">
          {isHost ? (
            <Crown className="w-4 h-4 text-slate-900" />
          ) : (
            <Users className="w-4 h-4 text-slate-900" />
          )}
          <h3 className="font-title font-semibold text-slate-900 text-sm">
            {isHost ? 'Hosting Lobby' : 'In Lobby'}
          </h3>
          <span className="text-slate-600 text-xs font-title ml-auto">
            {lobby.status === 'open' ? 'Open' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 p-4">
        <Link
          href={`/lobbies/${lobby.id}`}
          className="flex gap-3 group"
        >
        {/* Game Cover */}
        <div className="w-16 h-24 overflow-hidden bg-slate-700/50 flex-shrink-0">
          {lobby.coverUrl ? (
            <img
              src={lobby.coverUrl}
              alt={lobby.game_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad className="w-6 h-6 text-slate-500" />
            </div>
          )}
        </div>

        {/* Lobby Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-title font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
            {lobby.title}
          </h4>
          <p className="text-sm text-slate-400 truncate font-title">{lobby.game_name}</p>
          
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              {platformIcons[lobby.platform]}
              {lobby.platform.toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {lobby.member_count}{lobby.max_players && `/${lobby.max_players}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </div>
        </Link>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}


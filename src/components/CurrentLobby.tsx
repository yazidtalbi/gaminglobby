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
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchCurrentLobby = async () => {
      setLoading(true)

      // First check if user is hosting a lobby
      const { data: hostedLobbyData, error: hostError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('host_id', userId)
        .in('status', ['open', 'in_progress'])
        .maybeSingle()

      if (hostError) {
        console.error('Error fetching hosted lobby:', hostError)
      }

      if (hostedLobbyData) {
        // Get member count separately
        const { count: memberCount } = await supabase
          .from('lobby_members')
          .select('*', { count: 'exact', head: true })
          .eq('lobby_id', hostedLobbyData.id)
        
        // Fetch square game cover (like sidebar)
        let coverUrl = null
        try {
          const res = await fetch(`/api/steamgriddb/game?id=${hostedLobbyData.game_id}`)
          const data = await res.json()
          coverUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
        } catch {}

        setLobby({
          ...hostedLobbyData,
          member_count: memberCount || 1,
          coverUrl,
        } as LobbyInfo)
        setIsHost(true)
        setLoading(false)
        return
      }

      // If not hosting, check if member of a lobby
      // Use a join query to get both membership and lobby in one query
      const { data: membershipData, error: memberError } = await supabase
        .from('lobby_members')
        .select(`
          lobby_id,
          lobby:lobbies!inner(
            id,
            title,
            game_id,
            game_name,
            platform,
            status,
            host_id,
            max_players,
            created_at
          )
        `)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      if (memberError) {
        console.error('[CurrentLobby] Error fetching membership:', memberError)
      }

      console.log('[CurrentLobby] Membership data for user', userId, ':', membershipData)

      if (membershipData?.lobby) {
        const lobbyInfo = membershipData.lobby as unknown as {
          id: string;
          title: string;
          game_id: string;
          game_name: string;
          platform: string;
          status: string;
          host_id: string;
          max_players: number | null;
          created_at: string;
        }

        console.log('[CurrentLobby] Found lobby for member:', lobbyInfo.id, 'Status:', lobbyInfo.status)

        // Only show if lobby is open or in progress
        if (lobbyInfo.status === 'open' || lobbyInfo.status === 'in_progress') {
          // Get member count separately
          const { count: memberCount } = await supabase
            .from('lobby_members')
            .select('*', { count: 'exact', head: true })
            .eq('lobby_id', lobbyInfo.id)
          
          // Fetch square game cover (like sidebar)
          let coverUrl = null
          try {
            const res = await fetch(`/api/steamgriddb/game?id=${lobbyInfo.game_id}`)
            const data = await res.json()
            coverUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
          } catch {}

          console.log('[CurrentLobby] Setting lobby for member:', lobbyInfo.title, 'Member count:', memberCount)

          setLobby({
            ...lobbyInfo,
            member_count: memberCount || 1,
            coverUrl,
          } as LobbyInfo)
          setIsHost(lobbyInfo.host_id === userId)
        } else {
          console.log('[CurrentLobby] Lobby is not open/in_progress, status:', lobbyInfo.status)
        }
      } else {
        console.log('[CurrentLobby] No membership found for user:', userId)
      }

      setLoading(false)
    }

    fetchCurrentLobby()

    // Subscribe to real-time updates for lobby_members and lobbies
    const channel = supabase
      .channel(`current-lobby-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_members',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch when membership changes (user joins/leaves)
          console.log('[CurrentLobby] Membership changed, refetching...')
          fetchCurrentLobby()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobbies',
          filter: `host_id=eq.${userId}`,
        },
        () => {
          // Refetch when hosted lobby changes
          console.log('[CurrentLobby] Hosted lobby changed, refetching...')
          fetchCurrentLobby()
        }
      )
      .subscribe((status) => {
        console.log('[CurrentLobby] Subscription status:', status)
      })

    // Also subscribe to lobby changes for the lobby the user is in
    // We'll set this up after we know which lobby they're in
    let lobbyChannel: ReturnType<typeof supabase.channel> | null = null
    
    const setupLobbySubscription = async () => {
      // Get current lobby ID
      const { data: membership } = await supabase
        .from('lobby_members')
        .select('lobby_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      
      if (membership?.lobby_id) {
        lobbyChannel = supabase
          .channel(`lobby-updates-${membership.lobby_id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'lobbies',
              filter: `id=eq.${membership.lobby_id}`,
            },
            () => {
              console.log('[CurrentLobby] Lobby changed, refetching...')
              fetchCurrentLobby()
            }
          )
          .subscribe()
      }
    }
    
    setupLobbySubscription()

    return () => {
      supabase.removeChannel(channel)
      if (lobbyChannel) {
        supabase.removeChannel(lobbyChannel)
      }
    }
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
          {isHost && (
            <Crown className="w-4 h-4 text-slate-900" />
          )}
          <h3 className="font-title font-semibold text-slate-900 text-sm uppercase">
            {isHost ? 'Hosting Lobby' : 'In Lobby'}
          </h3>
          <span className="text-slate-900 text-xs font-title ml-auto">
            {lobby.status === 'open' ? 'Open' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 p-4">
        <Link
          href={`/lobbies/${lobby.id}`}
          className="flex gap-4 group"
        >
        {/* Square Game Cover */}
        <div className="w-20 h-20 overflow-hidden bg-slate-700/50 flex-shrink-0">
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
          <h4 className="font-title font-bold text-white text-lg truncate group-hover:text-cyan-400 transition-colors">
            {lobby.title}
          </h4>
          <p className="text-sm text-slate-400 truncate font-title uppercase mt-1">{lobby.game_name}</p>
          
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              {platformIcons[lobby.platform]}
              <span className="uppercase">{lobby.platform}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {lobby.member_count}{lobby.max_players && `/${lobby.max_players}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </span>
          </div>
        </div>

        {/* External Link Icon */}
        <div className="flex items-center flex-shrink-0">
          <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
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


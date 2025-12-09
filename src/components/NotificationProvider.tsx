'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from './Toast'
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

interface LobbyInvite {
  id: string
  lobby_id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
}

interface LobbyMember {
  id: string
  lobby_id: string
  user_id: string
  joined_at: string
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Handle new lobby invites
  const handleInvite = useCallback(async (payload: RealtimePostgresInsertPayload<LobbyInvite>) => {
    const invite = payload.new
    
    // Fetch inviter info
    const { data: fromUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', invite.from_user_id)
      .single()

    // Fetch lobby info
    const { data: lobby } = await supabase
      .from('lobbies')
      .select('title, game_name, game_id')
      .eq('id', invite.lobby_id)
      .single()

    // Fetch game image if game_id exists
    let gameImageUrl: string | undefined
    if (lobby?.game_id) {
      try {
        const response = await fetch(`/api/steamgriddb/game?id=${lobby.game_id}`)
        const data = await response.json()
        if (data.game?.coverThumb || data.game?.coverUrl) {
          gameImageUrl = data.game.coverThumb || data.game.coverUrl
        }
      } catch (error) {
        console.error('Failed to fetch game image:', error)
        // Continue without image if fetch fails
      }
    }

    addToast({
      type: 'invite',
      title: 'Lobby Invitation',
      message: `${fromUser?.username || 'Someone'} invited you to join "${lobby?.title || 'a lobby'}" for ${lobby?.game_name || 'a game'}`,
      imageUrl: gameImageUrl,
      action: {
        label: 'View Invites',
        onClick: () => router.push('/invites'),
      },
      duration: 8000,
    })
  }, [supabase, addToast, router])

  // Handle new lobby member (for host notification)
  const handleLobbyJoin = useCallback(async (payload: RealtimePostgresInsertPayload<LobbyMember>) => {
    const member = payload.new
    
    // Check if current user is the host of this lobby
    const { data: lobby } = await supabase
      .from('lobbies')
      .select('host_id, title, game_name, game_id')
      .eq('id', member.lobby_id)
      .single()

    if (lobby?.host_id !== user?.id) return // Only notify host
    if (member.user_id === user?.id) return // Don't notify for own join

    // Fetch member info
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', member.user_id)
      .single()

    // Fetch game image if game_id exists
    let gameImageUrl: string | undefined
    if (lobby?.game_id) {
      try {
        const response = await fetch(`/api/steamgriddb/game?id=${lobby.game_id}`)
        const data = await response.json()
        if (data.game?.coverThumb || data.game?.coverUrl) {
          gameImageUrl = data.game.coverThumb || data.game.coverUrl
        }
      } catch (error) {
        console.error('Failed to fetch game image:', error)
        // Continue without image if fetch fails
      }
    }

    addToast({
      type: 'join',
      title: 'New Member Joined',
      message: `${memberProfile?.username || 'Someone'} joined your lobby "${lobby?.title || 'your lobby'}"`,
      imageUrl: gameImageUrl,
      action: {
        label: 'View Lobby',
        onClick: () => router.push(`/lobbies/${member.lobby_id}`),
      },
      duration: 6000,
    })
  }, [supabase, addToast, router, user?.id])

  useEffect(() => {
    if (!user?.id) return

    // Subscribe to lobby invites for this user
    const inviteChannel = supabase
      .channel(`invites:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_invites',
          filter: `to_user_id=eq.${user.id}`,
        },
        (payload) => handleInvite(payload as RealtimePostgresInsertPayload<LobbyInvite>)
      )
      .subscribe()

    // Subscribe to lobby members for lobbies the user hosts
    const memberChannel = supabase
      .channel(`lobby_members:host:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_members',
        },
        (payload) => handleLobbyJoin(payload as RealtimePostgresInsertPayload<LobbyMember>)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(inviteChannel)
      supabase.removeChannel(memberChannel)
    }
  }, [user?.id, supabase, handleInvite, handleLobbyJoin])

  // Update online status periodically
  useEffect(() => {
    if (!user?.id) return

    const updateOnlineStatus = async () => {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    // Update immediately
    updateOnlineStatus()

    // Update every 60 seconds
    const interval = setInterval(updateOnlineStatus, 60000)

    return () => clearInterval(interval)
  }, [user?.id, supabase])

  return <>{children}</>
}


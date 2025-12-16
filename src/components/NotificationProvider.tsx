'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useVisibility } from '@/hooks/useVisibility'
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

interface GameLobbyNotification {
  id: string
  user_id: string
  type: 'game_lobby_created'
  title: string
  body: string
  data: {
    lobby_id: string
    game_id: string
    game_name: string
  }
  read: boolean
  created_at: string
}


export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const isVisible = useVisibility()
  const supabase = useMemo(() => createClient(), [])

  // Check if notifications are enabled
  const areNotificationsEnabled = useCallback(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('notifications_enabled')
    return stored === null || stored === 'true' // Default to enabled
  }, [])

  // Handle new lobby invites
  const handleInvite = useCallback(async (payload: RealtimePostgresInsertPayload<LobbyInvite>) => {
    if (!areNotificationsEnabled()) return

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
  }, [supabase, addToast, router, areNotificationsEnabled])

  // Handle game lobby created notifications
  const handleGameLobbyCreated = useCallback(async (payload: RealtimePostgresInsertPayload<GameLobbyNotification>) => {
    if (!areNotificationsEnabled()) {
      console.log('Notifications disabled in localStorage')
      return
    }

    const notification = payload.new
    console.log('Processing game lobby notification:', notification)
    
    // Parse JSONB data field - Supabase returns it as an object, not a string
    let gameData: { lobby_id: string; game_id: string; game_name: string } | null = null
    
    try {
      if (typeof notification.data === 'string') {
        gameData = JSON.parse(notification.data)
      } else if (notification.data && typeof notification.data === 'object') {
        gameData = notification.data as { lobby_id: string; game_id: string; game_name: string }
      }
    } catch (error) {
      console.error('Error parsing notification data:', error, notification.data)
      return
    }
    
    if (!gameData?.lobby_id) {
      console.error('Invalid notification data - missing lobby_id:', notification)
      return
    }

    // Fetch game image if game_id exists
    let gameImageUrl: string | undefined
    if (gameData?.game_id) {
      try {
        const response = await fetch(`/api/steamgriddb/game?id=${gameData.game_id}`)
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
      type: 'info',
      title: notification.title,
      message: notification.body,
      imageUrl: gameImageUrl,
      action: {
        label: 'View Lobby',
        onClick: () => router.push(`/lobbies/${gameData.lobby_id}`),
      },
      duration: 8000,
    })
  }, [supabase, addToast, router, areNotificationsEnabled])


  useEffect(() => {
    if (!user?.id || !isVisible) return

    // Subscribe to lobby invites for this user - pause when tab is hidden
    const inviteChannel = supabase
      .channel(`notification_invites:${user.id}`)
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

    // Subscribe to game lobby created notifications for this user
    // Match the exact pattern used for invites - simple and direct
    const gameLobbyChannel = supabase
      .channel(`notification_game_lobbies:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification received (all types):', payload.new)
          const notification = payload.new as GameLobbyNotification
          // Only handle game_lobby_created type
          if (notification.type === 'game_lobby_created') {
            console.log('Processing game_lobby_created notification')
            handleGameLobbyCreated(payload as RealtimePostgresInsertPayload<GameLobbyNotification>)
          }
        }
      )
      .subscribe((status) => {
        console.log('Game lobby notifications subscription status:', status)
      })

    return () => {
      supabase.removeChannel(inviteChannel)
      supabase.removeChannel(gameLobbyChannel)
    }
  }, [user?.id, supabase, handleInvite, handleGameLobbyCreated, isVisible])

  // Note: Removed heartbeat-style profile updates
  // Profile last_active_at is now updated only on:
  // - Login (via AuthContext)
  // - Explicit user actions (joining lobbies, voting, etc.)
  // This eliminates unnecessary PATCH /profiles calls when user is idle

  return <>{children}</>
}


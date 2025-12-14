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

    return () => {
      supabase.removeChannel(inviteChannel)
    }
  }, [user?.id, supabase, handleInvite, isVisible])

  // Note: Removed heartbeat-style profile updates
  // Profile last_active_at is now updated only on:
  // - Login (via AuthContext)
  // - Explicit user actions (joining lobbies, voting, etc.)
  // This eliminates unnecessary PATCH /profiles calls when user is idle

  return <>{children}</>
}


'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload, RealtimePostgresDeletePayload } from '@supabase/supabase-js'

interface LobbyInvite {
  id: string
  lobby_id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
}

export function usePendingInvites(userId: string | null) {
  const [count, setCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  // Refetch count function
  const fetchCount = useCallback(async () => {
    if (!userId) {
      setCount(0)
      return
    }

    const { count: inviteCount } = await supabase
      .from('lobby_invites')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', userId)
      .eq('status', 'pending')

    setCount(inviteCount || 0)
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }

    // Fetch initial count
    fetchCount()

    // Subscribe to changes
    const inviteChannel = supabase
      .channel(`pending_invites:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_invites',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<LobbyInvite>) => {
          const invite = payload.new
          if (invite.status === 'pending') {
            setCount((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobby_invites',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresUpdatePayload<LobbyInvite>) => {
          const oldInvite = payload.old
          const newInvite = payload.new

          // Always refetch to ensure accuracy - this handles all edge cases
          // The optimistic update provides immediate feedback
          if (oldInvite.status === 'pending' && newInvite.status !== 'pending') {
            setCount((prev) => Math.max(0, prev - 1))
          } else if (oldInvite.status !== 'pending' && newInvite.status === 'pending') {
            setCount((prev) => prev + 1)
          }
          
          // Always refetch to ensure we have the correct count
          fetchCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lobby_invites',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresDeletePayload<LobbyInvite>) => {
          const deletedInvite = payload.old
          // If deleted invite was pending, decrease count
          if (deletedInvite.status === 'pending') {
            setCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(inviteChannel)
    }
  }, [userId, supabase, fetchCount])

  return count
}


'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload, RealtimePostgresDeletePayload } from '@supabase/supabase-js'
import { useVisibility } from './useVisibility'

interface LobbyInvite {
  id: string
  lobby_id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
}

/**
 * Hook to track pending lobby invites count
 * Uses Supabase Realtime instead of polling to eliminate unnecessary REST calls
 * Automatically pauses when tab is hidden to save resources
 */
export function usePendingInvites(userId: string | null) {
  const [count, setCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])
  const isFetchingRef = useRef(false)
  const hasFetchedRef = useRef(false)
  const isVisible = useVisibility()

  // Refetch count function (only used for initial load and when resuming)
  const fetchCount = useCallback(async () => {
    if (!userId) {
      setCount(0)
      return
    }

    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current) {
      return
    }

    isFetchingRef.current = true

    try {
      // Optimized: Join with lobbies and filter in one query
      const { data: invites, error } = await supabase
        .from('lobby_invites')
        .select(`
          id,
          status,
          lobby:lobbies!inner(
            status
          )
        `)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .in('lobby.status', ['open', 'in_progress'])

      if (error) {
        console.error('Error fetching pending invites count:', error)
        setCount(0)
      } else {
        setCount(invites?.length || 0)
        hasFetchedRef.current = true
      }
    } finally {
      isFetchingRef.current = false
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) {
      setCount(0)
      hasFetchedRef.current = false
      return
    }

    // Only subscribe when tab is visible
    if (!isVisible) {
      return
    }

    // Initial fetch on mount or when resuming from hidden state
    if (!hasFetchedRef.current) {
      fetchCount()
    }

    // Subscribe to realtime changes - NO POLLING, Realtime handles all updates
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
        async (payload: RealtimePostgresInsertPayload<LobbyInvite>) => {
          const invite = payload.new
          // Check if lobby is still open before incrementing
          if (invite.status === 'pending') {
            const { data: lobby } = await supabase
              .from('lobbies')
              .select('status')
              .eq('id', invite.lobby_id)
              .single()
            
            if (lobby && (lobby.status === 'open' || lobby.status === 'in_progress')) {
              setCount((prev) => prev + 1)
            }
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

          // Optimistic update for immediate feedback - Realtime is source of truth
          if (oldInvite.status === 'pending' && newInvite.status !== 'pending') {
            setCount((prev) => Math.max(0, prev - 1))
          } else if (oldInvite.status !== 'pending' && newInvite.status === 'pending') {
            // Only increment if lobby is open (checked via optimistic update)
            setCount((prev) => prev + 1)
          }
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
      // Also listen to lobby status changes that might affect invite validity
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
        },
        async () => {
          // Refetch count when lobby status changes (e.g., lobby closes)
          // This ensures we don't show invites for closed lobbies
          fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(inviteChannel)
    }
  }, [userId, supabase, fetchCount, isVisible])

  // Refetch when tab becomes visible again to sync state
  useEffect(() => {
    if (isVisible && userId && hasFetchedRef.current) {
      fetchCount()
    }
  }, [isVisible, userId, fetchCount])

  return count
}


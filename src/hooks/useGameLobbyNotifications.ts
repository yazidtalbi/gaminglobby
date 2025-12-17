'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js'
import { useVisibility } from './useVisibility'

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

/**
 * Hook to track unread game lobby notifications per game
 * Returns a Set of game_ids that have unread notifications
 * Uses Supabase Realtime instead of polling
 */
export function useGameLobbyNotifications(userId: string | null): Set<string> {
  const [gameIdsWithNotifications, setGameIdsWithNotifications] = useState<Set<string>>(new Set())
  const supabase = useMemo(() => createClient(), [])
  const isFetchingRef = useRef(false)
  const hasFetchedRef = useRef(false)
  const isVisible = useVisibility()

  // Fetch unread notifications function
  const fetchUnreadNotifications = useCallback(async () => {
    if (!userId) {
      setGameIdsWithNotifications(new Set())
      return
    }

    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current) {
      return
    }

    isFetchingRef.current = true

    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', userId)
        .eq('type', 'game_lobby_created')
        .eq('read', false)

      if (error) {
        console.error('Error fetching game lobby notifications:', error)
        setGameIdsWithNotifications(new Set())
      } else {
        // Extract game_ids from notifications
        const gameIds = new Set<string>()
        notifications?.forEach((notif) => {
          const data = notif.data as { game_id: string } | null
          if (data?.game_id) {
            gameIds.add(data.game_id)
          }
        })
        setGameIdsWithNotifications(gameIds)
        hasFetchedRef.current = true
      }
    } finally {
      isFetchingRef.current = false
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) {
      setGameIdsWithNotifications(new Set())
      hasFetchedRef.current = false
      return
    }

    // Only subscribe when tab is visible
    if (!isVisible) {
      return
    }

    // Initial fetch on mount or when resuming from hidden state
    if (!hasFetchedRef.current) {
      fetchUnreadNotifications()
    }

    // Subscribe to realtime changes
    const notificationChannel = supabase
      .channel(`game_lobby_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<GameLobbyNotification>) => {
          const notification = payload.new
          if (notification.type === 'game_lobby_created' && !notification.read) {
            const data = notification.data as { game_id: string } | null
            if (data?.game_id) {
              setGameIdsWithNotifications((prev) => {
                const newSet = new Set(prev)
                newSet.add(data.game_id)
                return newSet
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresUpdatePayload<GameLobbyNotification>) => {
          const oldNotification = payload.old
          const newNotification = payload.new

          // If notification was marked as read, check if there are other unread notifications for this game
          if (oldNotification.read === false && newNotification.read === true) {
            const oldData = oldNotification.data as { game_id: string } | null
            if (oldData?.game_id) {
              // Check if there are other unread notifications for this game
              supabase
                .from('notifications')
                .select('id')
                .eq('user_id', userId)
                .eq('type', 'game_lobby_created')
                .eq('read', false)
                .eq('data->>game_id', oldData.game_id)
                .limit(1)
                .then(({ data: remainingNotifications }) => {
                  setGameIdsWithNotifications((prev) => {
                    const newSet = new Set(prev)
                    // Only remove if no other unread notifications exist for this game
                    if (!remainingNotifications || remainingNotifications.length === 0) {
                      newSet.delete(oldData.game_id)
                    }
                    return newSet
                  })
                })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationChannel)
    }
  }, [userId, supabase, fetchUnreadNotifications, isVisible])

  // Refetch when tab becomes visible again to sync state
  useEffect(() => {
    if (isVisible && userId && hasFetchedRef.current) {
      fetchUnreadNotifications()
    }
  }, [isVisible, userId, fetchUnreadNotifications])

  return gameIdsWithNotifications
}

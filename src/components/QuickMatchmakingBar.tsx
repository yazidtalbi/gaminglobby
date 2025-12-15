'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Gamepad2, Home, X } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { ConfirmCloseLobbyModal } from '@/components/ConfirmCloseLobbyModal'

interface RecentGame {
  game_id: string
  game_name: string
  iconUrl: string | null
}

interface CurrentLobby {
  id: string
  game_id: string
  game_name: string
  title: string
  iconUrl: string | null
  created_at: string
  host_id: string
}

export function QuickMatchmakingBar() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [recentGame, setRecentGame] = useState<RecentGame | null>(null)
  const [currentLobby, setCurrentLobby] = useState<CurrentLobby | null>(null)
  const [hasNewEvents, setHasNewEvents] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [elapsedTime, setElapsedTime] = useState<string>('')
  const [showCloseLobbyModal, setShowCloseLobbyModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const supabase = createClient()

  // Hide on lobby pages
  const isOnLobbyPage = pathname?.startsWith('/lobbies/')

  // Track if component is mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch current lobby and recent game
  useEffect(() => {
    if (!user) {
      setRecentGame(null)
      setCurrentLobby(null)
      return
    }

    const fetchData = async () => {
      // First check if user has an active lobby (hosting or member)
      const { data: hostedLobby } = await supabase
        .from('lobbies')
        .select('id, game_id, game_name, title, created_at, host_id')
        .eq('host_id', user.id)
        .in('status', ['open', 'in_progress'])
        .single()

      if (hostedLobby) {
        // Fetch game icon
        let iconUrl = null
        try {
          const res = await fetch(`/api/steamgriddb/game?id=${hostedLobby.game_id}`)
          const data = await res.json()
          iconUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
        } catch {}

        setCurrentLobby({
          id: hostedLobby.id,
          game_id: hostedLobby.game_id,
          game_name: hostedLobby.game_name,
          title: hostedLobby.title,
          iconUrl,
          created_at: hostedLobby.created_at,
          host_id: hostedLobby.host_id,
        })
        setRecentGame({
          game_id: hostedLobby.game_id,
          game_name: hostedLobby.game_name,
          iconUrl,
        })
        return
      }

      // Check if user is a member of any active lobby
      const { data: memberLobby } = await supabase
        .from('lobby_members')
        .select('lobby_id, lobbies!inner(id, game_id, game_name, title, status, created_at, host_id)')
        .eq('user_id', user.id)
        .eq('lobbies.status', 'open')
        .or('lobbies.status.eq.in_progress')
        .limit(1)
        .single()

      if (memberLobby && memberLobby.lobbies) {
        const lobby = memberLobby.lobbies as any
        let iconUrl = null
        try {
          const res = await fetch(`/api/steamgriddb/game?id=${lobby.game_id}`)
          const data = await res.json()
          iconUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
        } catch {}

        setCurrentLobby({
          id: lobby.id,
          game_id: lobby.game_id,
          game_name: lobby.game_name,
          title: lobby.title,
          iconUrl,
          created_at: lobby.created_at,
          host_id: lobby.host_id,
        })
        setRecentGame({
          game_id: lobby.game_id,
          game_name: lobby.game_name,
          iconUrl,
        })
        return
      }

      // Fallback: get the most recent lobby created by the user (for quick matchmaking)
      const { data: recentLobby } = await supabase
        .from('lobbies')
        .select('game_id, game_name')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentLobby) {
        // Fetch game icon
        let iconUrl = null
        try {
          const res = await fetch(`/api/steamgriddb/game?id=${recentLobby.game_id}`)
          const data = await res.json()
          iconUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
        } catch {}

        setRecentGame({
          game_id: recentLobby.game_id,
          game_name: recentLobby.game_name,
          iconUrl,
        })
      } else {
        // Final fallback: get the first game from user's library
        const { data: userGame } = await supabase
          .from('user_games')
          .select('game_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (userGame) {
          let iconUrl = null
          try {
            const res = await fetch(`/api/steamgriddb/game?id=${userGame.game_id}`)
            const data = await res.json()
            iconUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
            setRecentGame({
              game_id: userGame.game_id,
              game_name: data.game?.name || 'Unknown Game',
              iconUrl,
            })
          } catch {}
        }
      }
    }

    fetchData()
  }, [user, supabase])

  // Subscribe to lobby status changes
  useEffect(() => {
    if (!currentLobby?.id || !user?.id) {
      return
    }

    const statusChannel = supabase
      .channel(`quick-matchmaking-status-${currentLobby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${currentLobby.id}`,
        },
        (payload) => {
          const updatedLobby = payload.new as { status: string }
          // If lobby is closed, clear it
          if (updatedLobby.status === 'closed' || updatedLobby.status === 'completed') {
            setCurrentLobby(null)
            setHasNewEvents(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(statusChannel)
    }
  }, [currentLobby?.id, user?.id, supabase])

  // Subscribe to lobby events for notifications
  useEffect(() => {
    if (!currentLobby?.id || !user?.id) {
      setHasNewEvents(false)
      return
    }

    const eventsChannel = supabase
      .channel(`quick-matchmaking-events-${currentLobby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${currentLobby.id}`,
        },
        (payload) => {
          const newMember = payload.new as { user_id: string }
          // Only show indicator if it's not the current user
          if (newMember.user_id !== user.id) {
            setHasNewEvents(true)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `lobby_id=eq.${currentLobby.id}`,
        },
        (payload) => {
          const newMessage = payload.new as { user_id: string; content: string }
          // Only show indicator if it's not the current user and it's not a system message
          if (newMessage.user_id !== user.id && !newMessage.content.startsWith('[SYSTEM]')) {
            setHasNewEvents(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(eventsChannel)
    }
  }, [currentLobby?.id, user?.id, supabase])

  // Calculate and update elapsed time
  useEffect(() => {
    if (!currentLobby?.created_at) {
      setElapsedTime('')
      return
    }

    const updateElapsedTime = () => {
      const now = new Date()
      const created = new Date(currentLobby.created_at)
      const diff = Math.floor((now.getTime() - created.getTime()) / 1000) // seconds

      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60

      setElapsedTime(`${minutes}m ${seconds}s`)
    }

    // Update immediately
    updateElapsedTime()

    // Update every second
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [currentLobby?.created_at])

  const handleQuickMatch = async () => {
    if (!currentLobby || !user) return

    // Navigate to the current lobby
    setHasNewEvents(false) // Clear notifications when navigating
    router.push(`/lobbies/${currentLobby.id}`)
  }

  const handleCloseLobbyClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent button's onClick
    
    if (!currentLobby || !user || currentLobby.host_id !== user.id) return

    setShowCloseLobbyModal(true)
  }

  const handleConfirmCloseLobby = async () => {
    if (!currentLobby || !user) return

    try {
      await supabase
        .from('lobbies')
        .update({ status: 'closed' })
        .eq('id', currentLobby.id)
      
      // The subscription will handle clearing the currentLobby state
    } catch (error) {
      console.error('Failed to close lobby:', error)
      throw error // Re-throw so the modal can handle it
    }
  }

  // Only show if user has an active lobby
  if (!user || !currentLobby || isOnLobbyPage) {
    return null
  }

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden">
      <div className="w-full bg-slate-800 border-t border-slate-700">
        <div className="flex items-center">
          <button
            onClick={handleQuickMatch}
            disabled={isRefreshing}
            className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
          >
            {/* Game Icon */}
            <div className="w-10 h-10 rounded overflow-hidden bg-slate-700 border border-slate-600 flex-shrink-0">
              {currentLobby.iconUrl ? (
                <img
                  src={currentLobby.iconUrl}
                  alt={currentLobby.game_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">
                {currentLobby.title}
              </p>
              <p className="text-xs text-slate-400 truncate">{currentLobby.game_name}</p>
            </div>

            {/* Elapsed Time - Only render after mount to prevent hydration mismatch */}
            {isMounted && elapsedTime && (
              <>
                <div className="h-8 w-px bg-slate-600" />
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {elapsedTime}
                </div>
              </>
            )}

            {/* RE Badge with Refresh Icon and Notification */}
            <div className="flex items-center gap-2">
              {hasNewEvents && (
                <span className="h-3.5 w-3.5 bg-orange-500 rounded-full border-2 border-slate-800 shadow-sm animate-pulse" title="New activity" />
              )}
              <span className="text-xs font-title font-bold uppercase text-cyan-400">RE</span>
              <RefreshCw 
                className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </div>
          </button>

          {/* Close Button - Only show if user is the host */}
          {currentLobby.host_id === user?.id && (
            <>
              <div className="h-8 w-px bg-slate-600" />
              <button
                onClick={handleCloseLobbyClick}
                className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                title="Close lobby"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmCloseLobbyModal
        isOpen={showCloseLobbyModal}
        onClose={() => setShowCloseLobbyModal(false)}
        onConfirm={handleConfirmCloseLobby}
        lobbyTitle={currentLobby.title}
      />
    </div>
  )
}

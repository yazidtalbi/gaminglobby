'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { LobbyChat } from './LobbyChat'
import { ConfirmCloseLobbyModal } from './ConfirmCloseLobbyModal'
import { ChevronUp, ChevronDown, Gamepad2, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'

interface LobbyInfo {
  id: string
  title: string
  game_id: string
  game_name: string
  status: string
  created_at: string
  host_id: string
  iconUrl?: string | null
}

export function FloatingLobbyChat() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [lobby, setLobby] = useState<LobbyInfo | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isHidden, setIsHidden] = useState(false)
  const [hasNewEvents, setHasNewEvents] = useState(false)
  const [elapsedTime, setElapsedTime] = useState<string>('')
  const [showCloseLobbyModal, setShowCloseLobbyModal] = useState(false)
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
        // Check if lobby is still open/in_progress (should be, but double-check)
        if (hostedLobby.status === 'open' || hostedLobby.status === 'in_progress') {
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
            created_at: hostedLobby.created_at,
            host_id: hostedLobby.host_id,
            iconUrl,
          })
        } else {
          // Lobby is closed, clear it
          setLobby(null)
          setIsExpanded(false)
          setHasNewEvents(false)
        }
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
        const lobbyArray = Array.isArray(memberData.lobby) ? memberData.lobby : [memberData.lobby]
        const lobbyInfo = (lobbyArray[0] || memberData.lobby) as {
          id: string
          title: string
          game_id: string
          game_name: string
          status: string
          created_at: string
          host_id: string
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
            created_at: lobbyInfo.created_at,
            host_id: lobbyInfo.host_id,
            iconUrl,
          })
        } else {
          // Lobby is closed, clear it
          setLobby(null)
          setIsExpanded(false)
          setHasNewEvents(false)
        }
      } else {
        // No membership found, clear lobby
        setLobby(null)
        setIsExpanded(false)
        setHasNewEvents(false)
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
        (payload) => {
          // If lobby was closed, immediately clear it
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'closed') {
            console.log('[FloatingLobbyChat] Hosted lobby closed, clearing immediately')
            setLobby(null)
            setIsExpanded(false)
            setHasNewEvents(false)
            return
          }
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

  // Subscribe to status changes for the current lobby
  useEffect(() => {
    if (!lobby?.id || !user) return

    console.log('[FloatingLobbyChat] Setting up status subscription for lobby:', lobby.id)
    const lobbyStatusChannel = supabase
      .channel(`floating-lobby-status-${lobby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobby.id}`,
        },
        (payload) => {
          console.log('[FloatingLobbyChat] Lobby status update received:', payload)
          // If the current lobby was closed, immediately clear it
          if (payload.new?.status === 'closed') {
            console.log('[FloatingLobbyChat] Current lobby closed, clearing immediately')
            setLobby(null)
            setIsExpanded(false)
            setHasNewEvents(false)
          }
        }
      )
      .subscribe((status) => {
        console.log('[FloatingLobbyChat] Status subscription status:', status)
      })

    return () => {
      console.log('[FloatingLobbyChat] Cleaning up status subscription for lobby:', lobby.id)
      supabase.removeChannel(lobbyStatusChannel)
    }
  }, [lobby?.id, user, supabase])

  // Subscribe to lobby events (new members, messages) for the current lobby
  useEffect(() => {
    if (!lobby?.id || !user?.id) {
      setHasNewEvents(false)
      return
    }

    // Reset indicator when lobby changes or chat is expanded
    if (isExpanded) {
      setHasNewEvents(false)
      return
    }

    console.log('[FloatingLobbyChat] Setting up real-time subscriptions for lobby:', lobby.id)
    const eventsChannel = supabase
      .channel(`floating-lobby-events-${lobby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          console.log('[FloatingLobbyChat] New member joined:', payload)
          const newMember = payload.new as { user_id: string; created_at: string }
          // Only show indicator if it's not the current user
          if (newMember.user_id !== user.id) {
            console.log('[FloatingLobbyChat] Setting hasNewEvents to true (new member)')
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
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          console.log('[FloatingLobbyChat] New message:', payload)
          const newMessage = payload.new as { user_id: string; created_at: string; content: string }
          // Only show indicator if it's not the current user and it's not a system message
          if (newMessage.user_id !== user.id && !newMessage.content.startsWith('[SYSTEM]')) {
            console.log('[FloatingLobbyChat] Setting hasNewEvents to true (new message)')
            setHasNewEvents(true)
          }
        }
      )
      .subscribe((status) => {
        console.log('[FloatingLobbyChat] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[FloatingLobbyChat] Successfully subscribed to real-time updates for lobby:', lobby.id)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[FloatingLobbyChat] Channel subscription error')
        } else if (status === 'TIMED_OUT') {
          console.error('[FloatingLobbyChat] Subscription timed out')
        } else if (status === 'CLOSED') {
          console.log('[FloatingLobbyChat] Subscription closed')
        }
      })

    return () => {
      console.log('[FloatingLobbyChat] Cleaning up real-time subscriptions for lobby:', lobby.id)
      supabase.removeChannel(eventsChannel)
    }
  }, [lobby?.id, user?.id, supabase, isExpanded])

  // Clear indicator when chat is expanded
  const handleExpand = () => {
    setIsExpanded(true)
    setHasNewEvents(false)
  }

  const handleCloseLobbyClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent button's onClick
    
    if (!lobby || !user || lobby.host_id !== user.id) return

    setShowCloseLobbyModal(true)
  }

  const handleConfirmCloseLobby = async () => {
    if (!lobby || !user) return

    try {
      await supabase
        .from('lobbies')
        .update({ status: 'closed' })
        .eq('id', lobby.id)
      
      // The subscription will handle clearing the lobby state
    } catch (error) {
      console.error('Failed to close lobby:', error)
      throw error // Re-throw so the modal can handle it
    }
  }

  // Calculate and update elapsed time
  useEffect(() => {
    if (!lobby?.created_at) return

    const updateElapsedTime = () => {
      const now = new Date()
      const created = new Date(lobby.created_at)
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
  }, [lobby?.created_at])

  // Hide if on lobby page, settings page, no lobby, user has hidden it, or on mobile
  if (loading || !user || !lobby || isOnLobbyPage || isOnSettingsPage || isHidden) {
    return null
  }

  return (
    <div className="hidden lg:block fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        // Compact view
        <div className="flex items-center gap-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={handleExpand}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors group relative flex-1"
            aria-label="Expand lobby chat"
            title="Expand lobby chat"
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
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-white group-hover:text-app-green-400 transition-colors">
                {lobby.title}
              </p>
              <p className="text-xs text-slate-400">{lobby.game_name}</p>
            </div>
            {elapsedTime && (
              <>
                <div className="h-8 w-px bg-slate-600" />
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {elapsedTime}
                </div>
              </>
            )}
            <div className="flex items-center gap-1">
              {hasNewEvents && (
                <span className="h-3.5 w-3.5 bg-orange-500 rounded-full border-2 border-slate-800 shadow-sm animate-pulse" title="New activity" />
              )}
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Close Button - Only show if user is the host */}
          {lobby.host_id === user?.id && (
            <>
              <div className="h-10 w-px bg-slate-600" />
              <button
                onClick={handleCloseLobbyClick}
                className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                title="Close lobby"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
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
              {/* Close Button - Only show if user is the host */}
              {lobby.host_id === user?.id && (
                <button
                  onClick={handleCloseLobbyClick}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Close lobby"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
          <div className="flex-1 overflow-hidden">
            <div className="h-full">
              <LobbyChat lobbyId={lobby.id} currentUserId={user.id} />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmCloseLobbyModal
        isOpen={showCloseLobbyModal}
        onClose={() => setShowCloseLobbyModal(false)}
        onConfirm={handleConfirmCloseLobby}
        lobbyTitle={lobby.title}
      />
    </div>
  )
}


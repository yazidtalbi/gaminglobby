'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Loader2, CheckCircle } from 'lucide-react'

interface InviteToLobbyButtonProps {
  targetUserId: string
  className?: string
}

export function InviteToLobbyButton({ targetUserId, className = '' }: InviteToLobbyButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const [hostedLobby, setHostedLobby] = useState<{
    id: string
    game_name: string
    title: string
  } | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [isInvited, setIsInvited] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's hosted lobby
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    const fetchHostedLobby = async () => {
      const { data } = await supabase
        .from('lobbies')
        .select('id, game_name, title')
        .eq('host_id', user.id)
        .in('status', ['open', 'in_progress'])
        .single()

      if (data) {
        setHostedLobby(data)
      }
      setIsLoading(false)
    }

    fetchHostedLobby()
  }, [user?.id, supabase])

  // Check if already invited
  useEffect(() => {
    if (!user?.id || !hostedLobby || targetUserId === user.id) return

    const checkInvite = async () => {
      const { data } = await supabase
        .from('lobby_invites')
        .select('id')
        .eq('lobby_id', hostedLobby.id)
        .eq('from_user_id', user.id)
        .eq('to_user_id', targetUserId)
        .eq('status', 'pending')
        .single()

      setIsInvited(!!data)
    }

    checkInvite()
  }, [user?.id, hostedLobby, targetUserId, supabase])

  const handleInvite = async () => {
    if (!user?.id || !hostedLobby || isInviting) return

    setIsInviting(true)

    try {
      await supabase.from('lobby_invites').insert({
        lobby_id: hostedLobby.id,
        from_user_id: user.id,
        to_user_id: targetUserId,
        status: 'pending',
      })

      setIsInvited(true)
    } catch (error) {
      console.error('Failed to send invite:', error)
    } finally {
      setIsInviting(false)
    }
  }

  // Don't show if:
  // - Not logged in
  // - Viewing own profile
  // - No hosted lobby
  if (!user || user.id === targetUserId || !hostedLobby || isLoading) {
    return null
  }

  return (
    <button
      onClick={handleInvite}
      disabled={isInviting || isInvited}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-colors
        ${isInvited
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-600 disabled:cursor-not-allowed'
        }
        ${className}
      `}
      title={`Invite to ${hostedLobby.game_name} lobby: ${hostedLobby.title}`}
    >
      {isInviting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sending...</span>
        </>
      ) : isInvited ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Invited to {hostedLobby.game_name}</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Invite to {hostedLobby.game_name}</span>
        </>
      )}
    </button>
  )
}


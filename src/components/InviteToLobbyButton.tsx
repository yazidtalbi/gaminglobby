'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

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
    game_id: string
    game_name: string
    title: string
  } | null>(null)
  const [gameIconUrl, setGameIconUrl] = useState<string | null>(null)
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
        .select('id, game_id, game_name, title')
        .eq('host_id', user.id)
        .in('status', ['open', 'in_progress'])
        .single()

      if (data) {
        setHostedLobby(data)
        
        // Fetch game icon
        try {
          const response = await fetch(`/api/steamgriddb/game?id=${data.game_id}`)
          const gameData = await response.json()
          setGameIconUrl(gameData.game?.squareCoverThumb || gameData.game?.squareCoverUrl || null)
        } catch {
          setGameIconUrl(null)
        }
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
      // Check target user's invite settings
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('allow_invites, invites_from_followers_only')
        .eq('id', targetUserId)
        .single()

      if (!targetProfile) {
        alert('User not found')
        return
      }

      // Check if invites are allowed
      if (targetProfile.allow_invites === false) {
        alert('This user does not accept invites')
        return
      }

      // Check if only followers can invite
      if (targetProfile.invites_from_followers_only === true) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('following_id', user.id)
          .single()

        if (!followData) {
          alert('This user only accepts invites from users they follow')
          return
        }
      }

      await supabase.from('lobby_invites').insert({
        lobby_id: hostedLobby.id,
        from_user_id: user.id,
        to_user_id: targetUserId,
        status: 'pending',
      })

      setIsInvited(true)
    } catch (error) {
      console.error('Failed to send invite:', error)
      alert('Failed to send invite. Please try again.')
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
        flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={`Invite to ${hostedLobby.game_name} lobby: ${hostedLobby.title}`}
    >
      {/* Corner brackets */}
      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
      <span className="relative z-10 flex items-center gap-2 max-w-[300px]">
        {isInviting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span className="truncate">SENDING...</span>
          </>
        ) : (
          <>
            {gameIconUrl && (
              <img
                src={gameIconUrl}
                alt={hostedLobby.game_name}
                className="w-5 h-5 object-cover flex-shrink-0"
              />
            )}
            <span className="truncate">
              {isInvited ? (
                <>&gt; INVITED TO {hostedLobby.game_name.toUpperCase()}</>
              ) : (
                <>&gt; INVITE TO {hostedLobby.game_name.toUpperCase()}</>
              )}
            </span>
          </>
        )}
      </span>
    </button>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { LobbyInvite, Profile, Lobby } from '@/types/database'
import { Bell, Check, X, Loader2, Gamepad2, Monitor } from 'lucide-react'
import Link from 'next/link'

interface InviteWithDetails extends LobbyInvite {
  from_user: Profile
  lobby: Lobby
}

const platformLabels: Record<string, string> = {
  pc: 'PC',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Mobile',
  other: 'Other',
}

export default function InvitesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [invites, setInvites] = useState<InviteWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (!user) return

    const fetchInvites = async () => {
      const { data } = await supabase
        .from('lobby_invites')
        .select(`
          *,
          from_user:profiles!lobby_invites_from_user_id_fkey(*),
          lobby:lobbies!lobby_invites_lobby_id_fkey(*)
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data) {
        // Filter out invites for closed lobbies
        const validInvites = (data as unknown as InviteWithDetails[]).filter(
          (invite) => invite.lobby.status !== 'closed'
        )
        setInvites(validInvites)
      }

      setIsLoading(false)
    }

    fetchInvites()

    // Subscribe to new invites
    const channel = supabase
      .channel('invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_invites',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          fetchInvites()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, authLoading, router, supabase])

  const handleAccept = async (invite: InviteWithDetails) => {
    if (!user) return

    setProcessingId(invite.id)

    try {
      // Check if user is already in an active lobby
      const { data: existingMembership } = await supabase
        .from('lobby_members')
        .select(`
          id,
          lobby:lobbies!inner(id, status)
        `)
        .eq('user_id', user.id)

      const activeMembership = existingMembership?.find((m) => {
        const lobbyData = m.lobby as unknown as { status: string }
        return lobbyData.status === 'open' || lobbyData.status === 'in_progress'
      })

      if (activeMembership) {
        alert('You are already in another active lobby. Leave it first to accept this invite.')
        setProcessingId(null)
        return
      }

      // Check if user is banned
      const { data: banData } = await supabase
        .from('lobby_bans')
        .select('id')
        .eq('lobby_id', invite.lobby_id)
        .eq('player_id', user.id)
        .single()

      if (banData) {
        alert('You are banned from this lobby.')
        setProcessingId(null)
        return
      }

      // Join lobby
      await supabase.from('lobby_members').insert({
        lobby_id: invite.lobby_id,
        user_id: user.id,
        role: 'member',
        ready: false,
      })

      // Update recent players (track encounters) - non-blocking
      supabase
        .rpc('update_recent_players', {
          p_user_id: user.id,
          p_lobby_id: invite.lobby_id,
        })
        .then(() => {
          // Success - no action needed
        })
        .catch((err) => {
          // Ignore errors if function doesn't exist yet or other issues
          console.log('Recent players update skipped:', err)
        })

      // Add system message for join
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      await supabase.from('lobby_messages').insert({
        lobby_id: invite.lobby_id,
        user_id: user.id,
        content: `[SYSTEM] ${profile?.username || 'Someone'} joined the lobby`,
      })

      // Update invite status
      await supabase
        .from('lobby_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id)

      router.push(`/lobbies/${invite.lobby_id}`)
    } catch (error) {
      console.error('Failed to accept invite:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (inviteId: string) => {
    setProcessingId(inviteId)

    try {
      await supabase
        .from('lobby_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId)

      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch (error) {
      console.error('Failed to decline invite:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-app-green-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-6 h-6 text-app-green-400" />
            Invites
          </h1>
          <p className="text-slate-400 mt-1">
            Lobby invitations from people you follow
          </p>
        </div>

        {/* Invites List */}
        {invites.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No pending invites</p>
            <p className="text-sm text-slate-500">
              When someone invites you to a lobby, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
              >
                {/* Inviter */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                    {invite.from_user.avatar_url ? (
                      <img
                        src={invite.from_user.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white">
                      <Link
                        href={`/u/${invite.from_user.id}`}
                        className="font-medium hover:text-app-green-400"
                      >
                        {invite.from_user.username}
                      </Link>{' '}
                      invited you to join
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Lobby Info */}
                <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-3">
                    <Gamepad2 className="w-5 h-5 text-app-green-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{invite.lobby.title}</p>
                      <p className="text-sm text-slate-400">{invite.lobby.game_name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {platformLabels[invite.lobby.platform]}
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            invite.lobby.status === 'open'
                              ? 'bg-app-green-500/20 text-app-green-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {invite.lobby.status === 'in_progress' ? 'In Progress' : 'Open'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={processingId === invite.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {processingId === invite.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Accept
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    disabled={processingId === invite.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


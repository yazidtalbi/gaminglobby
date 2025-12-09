'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { LobbyChat } from '@/components/LobbyChat'
import { LobbyMembers } from '@/components/LobbyMembers'
import { LobbyGuideCard } from '@/components/LobbyGuideCard'
import { ConfirmCloseLobbyModal } from '@/components/ConfirmCloseLobbyModal'
import { Lobby, LobbyMember, Profile, GameGuide } from '@/types/database'
import {
  Gamepad2,
  Users,
  Monitor,
  MessageSquare,
  ExternalLink,
  XCircle,
  Loader2,
  UserPlus,
  LogOut,
  Crown,
} from 'lucide-react'
import Link from 'next/link'

interface LobbyMemberWithProfile extends LobbyMember {
  profile: Profile
}

const platformLabels: Record<string, string> = {
  pc: 'PC',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Mobile',
  other: 'Other',
}

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const lobbyId = params.lobbyId as string
  const { user } = useAuth()
  const supabase = createClient()

  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [host, setHost] = useState<Profile | null>(null)
  const [members, setMembers] = useState<LobbyMemberWithProfile[]>([])
  const [featuredGuide, setFeaturedGuide] = useState<GameGuide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [showCloseLobbyModal, setShowCloseLobbyModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMember = members.some((m) => m.user_id === user?.id)
  const isHost = lobby?.host_id === user?.id

  // Fetch lobby data
  const fetchLobby = useCallback(async () => {
    // Close inactive lobbies first
    await supabase.rpc('close_inactive_lobbies')

    const { data: lobbyData, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', lobbyId)
      .single()

    if (lobbyError || !lobbyData) {
      router.push('/')
      return
    }

    // Check if closed
    if (lobbyData.status === 'closed') {
      router.push(`/games/${lobbyData.game_id}`)
      return
    }

    setLobby(lobbyData)

    // Fetch host
    const { data: hostData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', lobbyData.host_id)
      .single()

    if (hostData) {
      setHost(hostData)
    }

    // Fetch members
    const { data: membersData } = await supabase
      .from('lobby_members')
      .select(`
        *,
        profile:profiles!lobby_members_user_id_fkey(*)
      `)
      .eq('lobby_id', lobbyId)

    if (membersData) {
      setMembers(membersData as unknown as LobbyMemberWithProfile[])
    }

    // Fetch featured guide
    if (lobbyData.featured_guide_id) {
      const { data: guideData } = await supabase
        .from('game_guides')
        .select('*')
        .eq('id', lobbyData.featured_guide_id)
        .single()

      if (guideData) {
        setFeaturedGuide(guideData)
      }
    }

    setIsLoading(false)
  }, [lobbyId, supabase, router])

  useEffect(() => {
    fetchLobby()
  }, [fetchLobby])

  // Update host activity
  useEffect(() => {
    if (!lobby || !isHost) return

    const updateActivity = async () => {
      await supabase
        .from('lobbies')
        .update({ host_last_active_at: new Date().toISOString() })
        .eq('id', lobbyId)

      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user?.id)
    }

    updateActivity()
    const interval = setInterval(updateActivity, 60000) // Every minute

    return () => clearInterval(interval)
  }, [lobby, isHost, lobbyId, user?.id, supabase])

  // Subscribe to lobby changes
  useEffect(() => {
    const channel = supabase
      .channel(`lobby-${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`,
        },
        (payload) => {
          const updatedLobby = payload.new as Lobby
          if (updatedLobby.status === 'closed') {
            router.push(`/games/${updatedLobby.game_id}`)
          } else {
            setLobby(updatedLobby)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        () => {
          fetchLobby()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobbyId, supabase, router, fetchLobby])

  const handleJoin = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsJoining(true)
    setError(null)

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
        const lobbyData = m.lobby as unknown as { id: string; status: string }
        return lobbyData.id !== lobbyId && (lobbyData.status === 'open' || lobbyData.status === 'in_progress')
      })

      if (activeMembership) {
        setError('You are already in another active lobby. Leave it first to join this one.')
        setIsJoining(false)
        return
      }

      // Join lobby
      const { error: joinError } = await supabase.from('lobby_members').insert({
        lobby_id: lobbyId,
        user_id: user.id,
        role: 'member',
      })

      if (joinError) throw joinError

      fetchLobby()
    } catch (err) {
      console.error('Failed to join lobby:', err)
      setError('Failed to join lobby. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user || isHost) return

    setIsLeaving(true)

    try {
      await supabase
        .from('lobby_members')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('user_id', user.id)

      router.push(`/games/${lobby?.game_id}`)
    } catch (err) {
      console.error('Failed to leave lobby:', err)
    } finally {
      setIsLeaving(false)
    }
  }

  const handleCloseLobby = async () => {
    await supabase
      .from('lobbies')
      .update({ status: 'closed' })
      .eq('id', lobbyId)

    router.push(`/games/${lobby?.game_id}`)
  }

  if (isLoading || !lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/games/${lobby.game_id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <Gamepad2 className="w-4 h-4" />
            {lobby.game_name}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{lobby.title}</h1>
              {lobby.description && (
                <p className="text-slate-400 mt-2">{lobby.description}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Monitor className="w-4 h-4" />
                  {platformLabels[lobby.platform]}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-4 h-4" />
                  {members.length}
                  {lobby.max_players && `/${lobby.max_players}`} players
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    lobby.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {lobby.status === 'in_progress' ? 'In Progress' : 'Open'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {lobby.discord_link && (
                <a
                  href={lobby.discord_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Join Discord
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {!isMember && (
                <button
                  onClick={handleJoin}
                  disabled={isJoining || (lobby.max_players !== null && members.length >= lobby.max_players)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Join Lobby
                </button>
              )}

              {isMember && !isHost && (
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-600/20 hover:text-red-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isLeaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Leave
                </button>
              )}

              {isHost && (
                <button
                  onClick={() => setShowCloseLobbyModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-medium rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Close Lobby
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Featured Guide */}
        {featuredGuide && (
          <div className="mb-8">
            <LobbyGuideCard guide={featuredGuide} />
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Lobby Chat
              </h2>
              {isMember ? (
                <div className="h-96">
                  <LobbyChat
                    lobbyId={lobbyId}
                    currentUserId={user?.id || ''}
                    disabled={!isMember || lobby.status === 'closed'}
                  />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  Join the lobby to participate in chat
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host */}
            {host && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Host
                </h3>
                <Link
                  href={`/u/${host.id}`}
                  className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                    {host.avatar_url ? (
                      <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{host.display_name || host.username}</p>
                    <p className="text-sm text-slate-400">@{host.username}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Members */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Members ({members.length})
                </h3>
                {isMember && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <LobbyMembers
                members={members}
                hostId={lobby.host_id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmCloseLobbyModal
        isOpen={showCloseLobbyModal}
        onClose={() => setShowCloseLobbyModal(false)}
        onConfirm={handleCloseLobby}
        lobbyTitle={lobby.title}
      />

      {showInviteModal && user && (
        <InviteModal
          lobbyId={lobbyId}
          userId={user.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}

function InviteModal({
  lobbyId,
  userId,
  onClose,
}: {
  lobbyId: string
  userId: string
  onClose: () => void
}) {
  const [following, setFollowing] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    const fetchFollowing = async () => {
      const { data } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId)

      if (data) {
        setFollowing(
          data.map((f) => f.following as unknown as Profile).filter(Boolean)
        )
      }
      setIsLoading(false)
    }

    fetchFollowing()
  }, [userId, supabase])

  const handleInvite = async (toUserId: string) => {
    setInvitingId(toUserId)

    try {
      await supabase.from('lobby_invites').insert({
        lobby_id: lobbyId,
        from_user_id: userId,
        to_user_id: toUserId,
        status: 'pending',
      })

      setInvitedIds((prev) => new Set(Array.from(prev).concat(toUserId)))
    } catch (error) {
      console.error('Failed to send invite:', error)
    } finally {
      setInvitingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Invite Someone</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p>You&apos;re not following anyone yet.</p>
              <p className="text-sm text-slate-500">Follow players to invite them to your lobbies.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {following.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{profile.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(profile.id)}
                    disabled={invitingId === profile.id || invitedIds.has(profile.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {invitingId === profile.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : invitedIds.has(profile.id) ? (
                      'Invited'
                    ) : (
                      'Invite'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


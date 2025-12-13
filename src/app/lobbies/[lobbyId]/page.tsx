'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { LobbyChat } from '@/components/LobbyChat'
import { LobbyMembers } from '@/components/LobbyMembers'
import { LobbyGuideCard } from '@/components/LobbyGuideCard'
import { ConfirmCloseLobbyModal } from '@/components/ConfirmCloseLobbyModal'
import { CRTCoverImage } from '@/components/CRTCoverImage'
import { Lobby, LobbyMember, Profile, GameGuide } from '@/types/database'
import { AwardType } from '@/lib/endorsements'
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
  Search,
} from 'lucide-react'
import { Bolt } from '@mui/icons-material'
import Link from 'next/link'

interface LobbyMemberWithProfile extends LobbyMember {
  profile: Profile
  endorsements?: Array<{ award_type: AwardType; count: number }>
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
  const { isPro } = usePremium()
  const supabase = createClient()

  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [isAutoInviting, setIsAutoInviting] = useState(false)
  const [host, setHost] = useState<Profile | null>(null)
  const [members, setMembers] = useState<LobbyMemberWithProfile[]>([])
  const [featuredGuide, setFeaturedGuide] = useState<GameGuide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [showCloseLobbyModal, setShowCloseLobbyModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optimisticReadyUpdates, setOptimisticReadyUpdates] = useState<Record<string, boolean>>({})
  const [autoInviteUsed, setAutoInviteUsed] = useState(false)
  const [gameCover, setGameCover] = useState<{ coverUrl: string | null; coverThumb: string | null; heroUrl: string | null; heroThumb: string | null; squareCoverUrl: string | null; squareCoverThumb: string | null } | null>(null)

  const isMember = members.some((m) => m.user_id === user?.id)
  const isHost = lobby?.host_id === user?.id

  // Reset auto-invite state when lobby ID changes
  useEffect(() => {
    setAutoInviteUsed(false)
  }, [lobbyId])

  // Fetch lobby data
  const fetchLobby = useCallback(async () => {
    // Close inactive lobbies (non-blocking, fire and forget)
    // Supabase RPC returns {data, error}, not a standard Promise with .catch()
    ;(async () => {
      try {
        await supabase.rpc('close_inactive_lobbies')
      } catch {
        // RPC might not exist, ignore errors silently
      }
    })()

    try {
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single()

      if (lobbyError || !lobbyData) {
        setError('Lobby not found')
        setIsLoading(false)
        return
      }

      // Check if closed
      if (lobbyData.status === 'closed') {
        router.push(`/games/${lobbyData.game_id}`)
        return
      }

      setLobby(lobbyData)

      // Fetch game cover image and hero banner
      if (lobbyData.game_id) {
        try {
          const gameResponse = await fetch(`/api/steamgriddb/game?id=${lobbyData.game_id}`)
          const gameData = await gameResponse.json()
          if (gameData.game) {
            // Fetch heroes for the game
            let heroUrl: string | null = null
            let heroThumb: string | null = null
            if (gameData.game.id) {
              try {
                const heroesResponse = await fetch(`/api/steamgriddb/heroes?gameId=${gameData.game.id}`)
                const heroesData = await heroesResponse.json()
                if (heroesData.heroes && heroesData.heroes.length > 0) {
                  // Use the first hero (highest score/quality)
                  heroUrl = heroesData.heroes[0].url || null
                  heroThumb = heroesData.heroes[0].thumb || null
                }
              } catch (heroError) {
                console.error('Failed to fetch heroes:', heroError)
              }
            }
            
            setGameCover({
              coverUrl: gameData.game.coverUrl || null,
              coverThumb: gameData.game.coverThumb || null,
              heroUrl,
              heroThumb,
              squareCoverUrl: gameData.game.squareCoverUrl || null,
              squareCoverThumb: gameData.game.squareCoverThumb || null,
            })
          }
        } catch (error) {
          console.error('Failed to fetch game cover:', error)
        }
      }

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
        .order('joined_at', { ascending: true }) // Oldest members first

      if (membersData) {
        // Fetch endorsements for each member
        const membersWithEndorsements = await Promise.all(
          (membersData as unknown as LobbyMemberWithProfile[]).map(async (member) => {
            const { data: endorsements } = await supabase
              .from('player_endorsements')
              .select('award_type')
              .eq('player_id', member.user_id)

            if (endorsements) {
              // Aggregate by award_type
              const counts = endorsements.reduce((acc, e) => {
                acc[e.award_type] = (acc[e.award_type] || 0) + 1
                return acc
              }, {} as Record<string, number>)

              member.endorsements = Object.entries(counts).map(([award_type, count]) => ({
                award_type: award_type as AwardType,
                count,
              }))
            }
            return member
          })
        )
        // Sort members by joined_at (oldest first)
        const sortedMembers = membersWithEndorsements.sort((a, b) => {
          const aTime = new Date(a.joined_at || 0).getTime()
          const bTime = new Date(b.joined_at || 0).getTime()
          return aTime - bTime
        })
        setMembers(sortedMembers)
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
    } catch (err) {
      console.error('Error fetching lobby:', err)
      setError('Failed to load lobby')
    } finally {
      setIsLoading(false)
    }
  }, [lobbyId, supabase, router])

  useEffect(() => {
    fetchLobby()
    
    // Periodic refetch as fallback for real-time updates (every 10 seconds)
    const interval = setInterval(() => {
      fetchLobby()
    }, 10000)
    
    return () => clearInterval(interval)
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
    if (!lobbyId) return

    console.log('[LobbyPage] Setting up real-time subscription for lobby:', lobbyId)
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
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async (payload) => {
          console.log('[LobbyPage] INSERT event received for lobby_members:', payload)
          const newMember = payload.new as LobbyMember
          
          // Fetch profile for the new member
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMember.user_id)
            .single()

          if (profileData) {
            setMembers((prev) => {
              // Check if member already exists (avoid duplicates)
              if (prev.some((m) => m.id === newMember.id)) {
                return prev
              }
              // Add new member and sort by joined_at to maintain order (oldest first)
              // Note: LobbyMember only has joined_at, not created_at
              const updated = [...prev, { ...newMember, profile: profileData } as LobbyMemberWithProfile]
              return updated.sort((a, b) => {
                const aTime = new Date(a.joined_at || 0).getTime()
                const bTime = new Date(b.joined_at || 0).getTime()
                return aTime - bTime
              })
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async (payload) => {
          console.log('[LobbyPage] ===== UPDATE EVENT RECEIVED =====')
          console.log('[LobbyPage] Full payload:', JSON.stringify(payload, null, 2))
          console.log('[LobbyPage] Payload.new:', payload.new)
          console.log('[LobbyPage] Payload.old:', payload.old)
          
          if (!payload.new) {
            console.warn('[LobbyPage] UPDATE event missing payload.new')
            return
          }
          
          const updatedMember = payload.new as LobbyMember
          const memberId = updatedMember.id as string
          const oldMember = payload.old as LobbyMember | undefined
          
          // Check if ready field changed - compare old and new values
          const oldReady = oldMember?.ready
          const newReady = updatedMember.ready
          
          // Always check if ready changed, regardless of how Supabase sends the data
          if (oldReady !== undefined && newReady !== undefined && oldReady !== newReady) {
            console.log('[LobbyPage] Ready state changed detected - memberId:', memberId, 'oldReady:', oldReady, 'newReady:', newReady)
            
            // Clear optimistic update for this member since we got the real update
            setOptimisticReadyUpdates((prev) => {
              const next = { ...prev }
              delete next[memberId]
              return next
            })
            
            // Update the member's ready state
            setMembers((prev) => {
              const memberIndex = prev.findIndex((m) => m.id === memberId)
              if (memberIndex === -1) {
                console.warn('[LobbyPage] Member not found in list:', memberId, 'Current members:', prev.map(m => ({ id: m.id, username: m.profile.username })))
                // If member not found, refetch to get updated data
                fetchLobby()
                return prev
              }
              
              const member = prev[memberIndex]
              console.log('[LobbyPage] Found member to update:', member.profile.username, 'current ready:', member.ready, 'new ready:', newReady)
              
              const updated = [...prev]
              updated[memberIndex] = { ...member, ready: newReady }
              
              console.log('[LobbyPage] Updated members list:', updated.map(m => ({ id: m.id, username: m.profile.username, ready: m.ready })))
              return updated
            })
          } else if ('ready' in updatedMember && updatedMember.ready !== undefined) {
            // Fallback: if ready field exists in new but old wasn't available, still update
            console.log('[LobbyPage] Ready field present in update (no old value to compare) - memberId:', memberId, 'newReady:', updatedMember.ready)
            
            setOptimisticReadyUpdates((prev) => {
              const next = { ...prev }
              delete next[memberId]
              return next
            })
            
            setMembers((prev) => {
              const memberIndex = prev.findIndex((m) => m.id === memberId)
              if (memberIndex === -1) {
                fetchLobby()
                return prev
              }
              
              const updated = [...prev]
              updated[memberIndex] = { ...prev[memberIndex], ready: updatedMember.ready as boolean }
              return updated
            })
          } else {
            console.log('[LobbyPage] UPDATE event does not contain ready field change')
            console.log('[LobbyPage] payload.new keys:', Object.keys(payload.new))
            console.log('[LobbyPage] payload.old:', payload.old)
            // Refetch to ensure we have the latest data for any other field changes
            fetchLobby()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          console.log('[LobbyPage] DELETE event received for lobby_members:', payload)
          const deletedMember = payload.old as LobbyMember
          
          console.log('[LobbyPage] Deleted member data:', deletedMember)
          
          // Remove member immediately using user_id (more reliable than id)
          if (deletedMember?.user_id) {
            console.log('[LobbyPage] Removing member by user_id:', deletedMember.user_id)
            setMembers((prev) => {
              const filtered = prev.filter((m) => m.user_id !== deletedMember.user_id)
              console.log('[LobbyPage] Members after removal:', filtered.length, 'prev:', prev.length)
              return filtered
            })
          } else if (deletedMember?.id) {
            // Fallback to id if user_id is not available
            console.log('[LobbyPage] Removing member by id:', deletedMember.id)
            setMembers((prev) => {
              const filtered = prev.filter((m) => m.id !== deletedMember.id)
              console.log('[LobbyPage] Members after removal (by id):', filtered.length, 'prev:', prev.length)
              return filtered
            })
          } else {
            // If payload is incomplete, refetch to be safe
            console.warn('[LobbyPage] DELETE payload incomplete, refetching lobby')
            fetchLobby()
          }
        }
      )
      .subscribe((status) => {
        console.log('[LobbyPage] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[LobbyPage] Successfully subscribed to real-time updates for lobby:', lobbyId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[LobbyPage] Channel subscription error')
        } else if (status === 'TIMED_OUT') {
          console.error('[LobbyPage] Subscription timed out')
        } else if (status === 'CLOSED') {
          console.log('[LobbyPage] Subscription closed')
        }
      })

    return () => {
      console.log('[LobbyPage] Cleaning up real-time subscription for lobby:', lobbyId)
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

      // Check if user is banned from this lobby
      const { data: banData } = await supabase
        .from('lobby_bans')
        .select('id')
        .eq('lobby_id', lobbyId)
        .eq('player_id', user.id)
        .single()

      if (banData) {
        setError('You are banned from this lobby.')
        setIsJoining(false)
        return
      }

      // Join lobby
      const { error: joinError } = await supabase.from('lobby_members').insert({
        lobby_id: lobbyId,
        user_id: user.id,
        role: 'member',
        ready: false,
      })

      if (joinError) {
        console.error('Join error:', joinError)
        // Provide more specific error messages
        if (joinError.code === '23505') {
          setError('You are already a member of this lobby.')
        } else if (joinError.code === '23503') {
          setError('Invalid lobby or user. Please refresh and try again.')
        } else {
          setError(joinError.message || 'Failed to join lobby. Please try again.')
        }
        setIsJoining(false)
        return
      }

      // Update recent players (track encounters) - non-blocking
      ;(async () => {
        try {
          await supabase.rpc('update_recent_players', {
            p_user_id: user.id,
            p_lobby_id: lobbyId,
          })
        } catch (err) {
          // Ignore errors if function doesn't exist yet or other issues
          console.log('Recent players update skipped:', err)
        }
      })()

      // Add system message for join - non-blocking
      ;(async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
          if (profile) {
            try {
              await supabase.from('lobby_messages').insert({
                lobby_id: lobbyId,
                user_id: user.id,
                content: `[SYSTEM] ${profile.username} joined the lobby`,
              })
            } catch (err) {
              console.log('Failed to add system message:', err)
            }
          }
        } catch (err) {
          console.log('Failed to fetch profile for system message:', err)
        }
      })()

      // Real-time subscription will update members list automatically
      // Refresh lobby data to show updated member list
      fetchLobby()
    } catch (err: any) {
      console.error('Failed to join lobby:', err)
      setError(err.message || 'Failed to join lobby. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user || isHost) return

    setIsLeaving(true)

    try {
      // Optimistic update: remove user from members list immediately
      setMembers((prev) => prev.filter((m) => m.user_id !== user.id))

      // Get username before leaving
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      await supabase
        .from('lobby_members')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('user_id', user.id)

      // Add system message for leave
      await supabase.from('lobby_messages').insert({
        lobby_id: lobbyId,
        user_id: user.id,
        content: `[SYSTEM] ${profile?.username || 'Someone'} left the lobby`,
      })

      router.push(`/games/${lobby?.game_id}`)
    } catch (err) {
      console.error('Failed to leave lobby:', err)
      // Revert optimistic update on error by refetching
      fetchLobby()
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-app-green-400 animate-spin" />
      </div>
    )
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-400">{error || 'Lobby not found'}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-app-green-600 hover:bg-app-green-500 text-white font-medium rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      {/* Hero Banner */}
      {gameCover && (gameCover.heroUrl || gameCover.heroThumb) && (
        <div className="relative h-48 md:h-56 lg:h-64 w-full overflow-hidden">
          <CRTCoverImage
            src={gameCover.heroUrl || gameCover.heroThumb || ''}
            alt={lobby?.game_name || 'Game banner'}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {/* Square Game Cover */}
            {gameCover && (gameCover.squareCoverThumb || gameCover.squareCoverUrl) && (
              <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-slate-700/50">
                <img
                  src={gameCover.squareCoverThumb || gameCover.squareCoverUrl || ''}
                  alt={lobby?.game_name || 'Game cover'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <Link
                href={`/games/${lobby.game_id}`}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2"
              >
                <Gamepad2 className="w-4 h-4" />
                {lobby.game_name}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{lobby.title}</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
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
                      ? 'bg-app-green-500/20 text-app-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {lobby.status === 'in_progress' ? 'In Progress' : 'Open'}
                </span>
              </div>
            </div>

            {/* Error Message for Auto-Invite */}
            {error && error.includes('invite') && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {isHost && isPro && (
                <button
                  onClick={async () => {
                    setIsAutoInviting(true)
                    setError(null)
                    try {
                      const response = await fetch('/api/lobbies/auto-invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lobbyId: lobbyId,
                          gameId: lobby.game_id,
                        }),
                      })
                      const data = await response.json()
                      if (data.error) {
                        setError(data.error)
                        console.error('Auto-invite error:', data.error)
                      } else {
                        // Mark auto-invite as used (disable button)
                        setAutoInviteUsed(true)
                        // Show success message
                        if (data.invited > 0) {
                          setError(null)
                          // Refresh lobby to show new members
                          fetchLobby()
                        } else {
                          setError(data.message || 'No eligible users found to invite')
                        }
                      }
                    } catch (error: any) {
                      setError(error.message || 'Failed to auto-invite. Please try again.')
                      console.error('Failed to auto-invite:', error)
                    } finally {
                      setIsAutoInviting(false)
                    }
                  }}
                  disabled={isAutoInviting || autoInviteUsed}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-400 font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-slate-900" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-slate-900" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-slate-900" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-slate-900" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isAutoInviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <Bolt className="w-4 h-4" />
                        AUTO INVITE
                      </>
                    )}
                  </span>
                </button>
              )}
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
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
                <MessageSquare className="w-5 h-5 text-app-green-400" />
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
                      <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
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
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Members ({members.length})
                  </h3>
                  {members.length > 0 && (
                    <span className="text-sm text-slate-400">
                      Ready: {members.filter((m) => {
                        // Use optimistic update if available, otherwise use actual ready state
                        const ready = optimisticReadyUpdates[m.id] !== undefined 
                          ? optimisticReadyUpdates[m.id] 
                          : m.ready
                        return ready === true
                      }).length} / {members.length}
                    </span>
                  )}
                </div>
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
                currentUserId={user?.id || ''}
                lobbyId={lobbyId}
                onMemberUpdate={fetchLobby}
                onMemberKicked={(userId) => {
                  if (userId === user?.id) {
                    router.push('/')
                  }
                }}
                onReadyStateChange={(memberId, ready) => {
                  // Track optimistic update
                  setOptimisticReadyUpdates((prev) => ({
                    ...prev,
                    [memberId]: ready,
                  }))
                  
                  // Optimistically update members state for instant ready count
                  setMembers((prev) => {
                    const updated = prev.map((m) =>
                      m.id === memberId ? { ...m, ready } : m
                    )
                    return updated
                  })
                }}
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
  const [users, setUsers] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      
      // Fetch all users (excluding current user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .order('username', { ascending: true })
        .limit(100) // Limit to first 100 users for performance

      if (data) {
        setUsers(data)
      }
      setIsLoading(false)
    }

    fetchUsers()
  }, [userId, supabase])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }
    
    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        (user.display_name && user.display_name.toLowerCase().includes(query))
    )
  }, [users, searchQuery])

  const handleInvite = async (toUserId: string) => {
    setInvitingId(toUserId)

    try {
      // Check target user's invite settings
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('allow_invites, invites_from_followers_only')
        .eq('id', toUserId)
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
          .eq('follower_id', toUserId)
          .eq('following_id', userId)
          .single()

        if (!followData) {
          alert('This user only accepts invites from users they follow')
          return
        }
      }

      await supabase.from('lobby_invites').insert({
        lobby_id: lobbyId,
        from_user_id: userId,
        to_user_id: toUserId,
        status: 'pending',
      })

      setInvitedIds((prev) => new Set(Array.from(prev).concat(toUserId)))
    } catch (error) {
      console.error('Failed to send invite:', error)
      alert('Failed to send invite. Please try again.')
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
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p>No users found</p>
              {searchQuery && (
                <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{profile.username}</p>
                      {profile.display_name && profile.display_name !== profile.username && (
                        <p className="text-xs text-slate-400">{profile.display_name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(profile.id)}
                    disabled={invitingId === profile.id || invitedIds.has(profile.id)}
                    className="px-3 py-1.5 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
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


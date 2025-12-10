'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LobbyMember, Profile } from '@/types/database'
import { OnlineIndicatorDot } from './OnlineIndicator'
import { PlayerAwards } from './PlayerAwards'
import { Crown, MessageSquare, MoreVertical, UserX, Ban, CheckCircle, XCircle } from 'lucide-react'
import { AwardType } from '@/lib/endorsements'

interface LobbyMemberWithProfile extends LobbyMember {
  profile: Profile
  endorsements?: Array<{
    award_type: AwardType
    count: number
  }>
}

interface LobbyMembersProps {
  members: LobbyMemberWithProfile[]
  hostId: string
  currentUserId: string
  lobbyId: string
  onMemberUpdate?: () => void
  onMemberKicked?: (userId: string) => void
  onReadyStateChange?: (memberId: string, ready: boolean) => void
  className?: string
}

export function LobbyMembers({ 
  members, 
  hostId, 
  currentUserId,
  lobbyId,
  onMemberUpdate,
  onMemberKicked,
  onReadyStateChange,
  className = '' 
}: LobbyMembersProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isTogglingReady, setIsTogglingReady] = useState<string | null>(null)
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const supabase = createClient()

  const isCurrentUserHost = currentUserId === hostId

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(menuRefs.current).forEach(([memberId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (activeMenu === memberId) {
            setActiveMenu(null)
          }
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  const handleToggleReady = async (memberId: string, currentReady: boolean) => {
    if (isTogglingReady) {
      console.log('Already toggling ready, ignoring click')
      return
    }

    const newReadyState = !currentReady
    console.log('[LobbyMembers] Toggle ready clicked:', { 
      memberId, 
      currentReady, 
      newReadyState,
      currentUserId,
      lobbyId 
    })
    
    // Optimistically update parent state for instant ready count update
    onReadyStateChange?.(memberId, newReadyState)

    setIsTogglingReady(memberId)
    try {
      console.log('[LobbyMembers] Updating database...')
      const { data, error } = await supabase
        .from('lobby_members')
        .update({ ready: newReadyState })
        .eq('id', memberId)
        .eq('user_id', currentUserId) // Ensure user can only update their own ready status
        .select()

      if (error) {
        console.error('[LobbyMembers] Ready toggle error:', error)
        // Revert optimistic update on error
        onReadyStateChange?.(memberId, currentReady)
        throw error
      }
      
      console.log('[LobbyMembers] Database update successful:', data)
      console.log('[LobbyMembers] Updated row:', data?.[0])
      console.log('[LobbyMembers] Waiting for real-time subscription to broadcast UPDATE event...')
      console.log('[LobbyMembers] The UPDATE event should arrive within 1-2 seconds...')
      
      // The real-time subscription will broadcast the UPDATE event to all users
      // Other users will see the change via the UPDATE subscription handler
      // The current user sees it via optimistic update
    } catch (err) {
      console.error('[LobbyMembers] Failed to toggle ready:', err)
      // Revert optimistic update on error
      onReadyStateChange?.(memberId, currentReady)
    } finally {
      setIsTogglingReady(null)
    }
  }

  const handleKick = async (memberId: string, userId: string, username: string) => {
    try {
      // Remove from lobby
      const { error: deleteError } = await supabase
        .from('lobby_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError

      // Add system message
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .single()

      await supabase.from('lobby_messages').insert({
        lobby_id: lobbyId,
        user_id: currentUserId,
        content: `[SYSTEM] ${username} was kicked by ${hostProfile?.username || 'the host'}`,
      })

      // Optimistic update will be handled by real-time subscription

      setActiveMenu(null)
      
      // Notify parent if the kicked user is the current user
      if (userId === currentUserId) {
        onMemberKicked?.(userId)
      }
      
      onMemberUpdate?.()
    } catch (err) {
      console.error('Failed to kick user:', err)
      // Revert optimistic update on error
      onMemberUpdate?.()
    }
  }

  const handleBan = async (memberId: string, userId: string, username: string) => {
    try {
      // Remove from lobby
      await supabase
        .from('lobby_members')
        .delete()
        .eq('id', memberId)

      // Add ban record
      await supabase.from('lobby_bans').insert({
        lobby_id: lobbyId,
        player_id: userId,
        banned_by: currentUserId,
      })

      // Add system message
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .single()

      await supabase.from('lobby_messages').insert({
        lobby_id: lobbyId,
        user_id: currentUserId,
        content: `[SYSTEM] ${username} was banned by ${hostProfile?.username || 'the host'}`,
      })

      setActiveMenu(null)
      onMemberUpdate?.()
    } catch (err) {
      console.error('Failed to ban user:', err)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {members.map((member) => {
        const isHost = member.user_id === hostId
        const isCurrentUser = member.user_id === currentUserId
        const canManage = isCurrentUserHost && !isHost && !isCurrentUser
        const showMenu = activeMenu === member.id

        return (
          <div
            key={member.id}
            className="relative flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors"
          >
            <Link
              href={`/u/${member.user_id}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700">
                  {member.profile.avatar_url ? (
                    <img
                      src={member.profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                  )}
                  <OnlineIndicatorDot lastActiveAt={member.profile.last_active_at} size="sm" />
                </div>
                {isHost && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">
                    {member.profile.username}
                  </span>
                  {isHost && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">
                      Host
                    </span>
                  )}
                </div>
                {member.profile.discord_tag && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MessageSquare className="w-3 h-3" />
                    <span>{member.profile.discord_tag}</span>
                  </div>
                )}
                {member.endorsements && member.endorsements.length > 0 && (
                  <div className="mt-1">
                    <PlayerAwards endorsements={member.endorsements} variant="compact" maxDisplay={2} />
                  </div>
                )}
              </div>
            </Link>

            {/* Ready Status & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Ready Toggle/Status */}
              {isCurrentUser ? (
                <button
                  onClick={() => handleToggleReady(member.id, member.ready || false)}
                  disabled={isTogglingReady === member.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    (member.ready || false)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                  } hover:opacity-80 disabled:opacity-50`}
                >
                  {(member.ready || false) ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Ready
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Not Ready
                    </>
                  )}
                </button>
              ) : (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    (member.ready || false)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                  }`}
                >
                  {(member.ready || false) ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Ready
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Not Ready
                    </>
                  )}
                </div>
              )}

              {/* Host Actions Menu */}
              {canManage && (
                <div className="relative" ref={(el) => (menuRefs.current[member.id] = el)}>
                  <button
                    onClick={() => setActiveMenu(showMenu ? null : member.id)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => handleKick(member.id, member.user_id, member.profile.username)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                        Kick from lobby
                      </button>
                      <button
                        onClick={() => handleBan(member.id, member.user_id, member.profile.username)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-slate-700"
                      >
                        <Ban className="w-4 h-4" />
                        Ban from lobby
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


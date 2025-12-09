'use client'

import Link from 'next/link'
import { LobbyMember, Profile } from '@/types/database'
import { OnlineIndicatorDot } from './OnlineIndicator'
import { Crown, MessageSquare } from 'lucide-react'

interface LobbyMemberWithProfile extends LobbyMember {
  profile: Profile
}

interface LobbyMembersProps {
  members: LobbyMemberWithProfile[]
  hostId: string
  className?: string
}

export function LobbyMembers({ members, hostId, className = '' }: LobbyMembersProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {members.map((member) => {
        const isHost = member.user_id === hostId

        return (
          <Link
            key={member.id}
            href={`/u/${member.user_id}`}
            className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors"
          >
            {/* Avatar */}
            <div className="relative">
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
            </div>
          </Link>
        )
      })}
    </div>
  )
}


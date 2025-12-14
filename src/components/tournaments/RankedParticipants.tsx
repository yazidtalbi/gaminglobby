'use client'

import { TournamentParticipant } from '@/types/tournaments'
import { TournamentState } from '@/lib/tournaments/state'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface RankedParticipantsProps {
  participants: TournamentParticipant[]
  tournamentState: TournamentState
}

export function RankedParticipants({ participants, tournamentState }: RankedParticipantsProps) {
  if (participants.length === 0) return null

  // Sort participants based on state
  const sortedParticipants =
    tournamentState === 'completed'
      ? [...participants].sort((a, b) => {
          // Winner first, then by placement
          if (a.final_placement === 1) return -1
          if (b.final_placement === 1) return 1
          if (a.final_placement && b.final_placement) {
            return a.final_placement - b.final_placement
          }
          if (a.final_placement) return -1
          if (b.final_placement) return 1
          return 0
        })
      : [...participants].sort((a, b) => {
          // Sort by status: checked_in > registered > others
          const statusOrder: Record<string, number> = {
            checked_in: 1,
            registered: 2,
            withdrawn: 3,
            disqualified: 4,
          }
          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
        })

  return (
    <div>
      <h2 className="text-xl font-title text-white mb-4">
        Participants ({participants.length})
      </h2>
      <div className="border border-slate-700/50 bg-slate-800/30 rounded-lg overflow-hidden">
        <div className="divide-y divide-slate-700/50">
          {sortedParticipants.map((participant) => {
            const profile = participant.profile
            const displayName = profile?.display_name || profile?.username || 'Unknown'
            const placement = participant.final_placement

            return (
              <Link
                key={participant.id}
                href={`/u/${profile?.username || profile?.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors"
              >
                {/* Placement Badge */}
                <div className="w-12 text-center flex-shrink-0">
                  {placement === 1 && <span className="text-2xl">🥇</span>}
                  {placement === 2 && <span className="text-2xl">🥈</span>}
                  {placement === 3 && <span className="text-2xl">🥉</span>}
                  {placement && placement > 3 && (
                    <span className="text-slate-500 font-bold">#{placement}</span>
                  )}
                  {!placement && tournamentState !== 'completed' && (
                    <Badge
                      variant={
                        participant.status === 'checked_in'
                          ? 'success'
                          : participant.status === 'registered'
                          ? 'info'
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {participant.status === 'checked_in'
                        ? 'Ready'
                        : participant.status === 'registered'
                        ? 'Registered'
                        : participant.status}
                    </Badge>
                  )}
                </div>

                {/* Avatar */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-12 h-12 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">?</span>
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{displayName}</p>
                  {placement === 1 && (
                    <p className="text-xs text-yellow-400">Tournament Winner</p>
                  )}
                  {placement === 2 && <p className="text-xs text-slate-400">Finalist</p>}
                  {placement === 3 && <p className="text-xs text-amber-600">Top 3</p>}
                  {!placement && tournamentState === 'completed' && (
                    <p className="text-xs text-slate-500">Participant</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

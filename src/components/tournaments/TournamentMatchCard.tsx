'use client'

import { TournamentMatch, TournamentWithHost } from '@/types/tournaments'
import Link from 'next/link'

interface TournamentMatchCardProps {
  match: TournamentMatch
  tournament: TournamentWithHost
  onUpdate: () => void
}

export function TournamentMatchCard({ match, tournament }: TournamentMatchCardProps) {
  const statusColors = {
    pending: 'bg-slate-600',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    forfeited: 'bg-red-500',
  }

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'Live',
    completed: 'Completed',
    forfeited: 'Forfeited',
  }

  return (
    <div className="border border-slate-700/50 bg-slate-800/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-title uppercase">
          Match {match.match_number}
        </span>
        <span className={`px-2 py-1 text-xs font-title uppercase text-white ${statusColors[match.status]}`}>
          {statusLabels[match.status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.participant1?.profile?.avatar_url ? (
              <img
                src={match.participant1.profile.avatar_url}
                alt={match.participant1.profile.username}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0" />
            )}
            <span className={`text-sm truncate ${match.winner_id === match.participant1_id ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
              {match.participant1?.profile?.display_name || match.participant1?.profile?.username || 'TBD'}
            </span>
          </div>
          {match.status === 'completed' && (
            <span className="text-sm font-bold text-white ml-2">{match.score1}</span>
          )}
        </div>

        <div className="text-xs text-slate-500 text-center">VS</div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.participant2?.profile?.avatar_url ? (
              <img
                src={match.participant2.profile.avatar_url}
                alt={match.participant2.profile.username}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0" />
            )}
            <span className={`text-sm truncate ${match.winner_id === match.participant2_id ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
              {match.participant2?.profile?.display_name || match.participant2?.profile?.username || 'TBD'}
            </span>
          </div>
          {match.status === 'completed' && (
            <span className="text-sm font-bold text-white ml-2">{match.score2}</span>
          )}
        </div>
      </div>

      {match.lobby_id && (
        <Link
          href={`/lobbies/${match.lobby_id}`}
          className="mt-3 block text-xs text-cyan-400 hover:text-cyan-300 text-center"
        >
          View Lobby →
        </Link>
      )}
    </div>
  )
}

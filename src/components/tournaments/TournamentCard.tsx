'use client'

import Link from 'next/link'
import { TournamentWithHost } from '@/types/tournaments'
import { Calendar, Users, Gamepad2 } from 'lucide-react'

interface TournamentCardProps {
  tournament: TournamentWithHost
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const startDate = new Date(tournament.start_at)
  const regDeadline = new Date(tournament.registration_deadline)
  const isRegistrationOpen = tournament.status === 'open' && regDeadline > new Date()
  const isFull = tournament.current_participants >= tournament.max_participants

  const statusColors = {
    draft: 'bg-slate-600',
    open: 'bg-green-500',
    registration_closed: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-purple-500',
    cancelled: 'bg-red-500',
  }

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="block border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
    >
      {tournament.cover_url && (
        <div className="w-full h-32 overflow-hidden">
          <img
            src={tournament.cover_url}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-title font-bold text-white line-clamp-2 flex-1">
            {tournament.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-title uppercase text-white ${statusColors[tournament.status]}`}>
            {tournament.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {tournament.description || 'No description'}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4" />
            <span>{tournament.game_name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{tournament.current_participants}/{tournament.max_participants}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {isRegistrationOpen && !isFull && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-xs text-cyan-400 font-title uppercase">Registration Open</span>
          </div>
        )}

        {isFull && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500 font-title uppercase">Full</span>
          </div>
        )}

        {/* Prize Badges Preview */}
        {(tournament.badge_1st_label || tournament.badge_2nd_label || tournament.badge_3rd_label) && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2 font-title uppercase">Prize Badges</p>
            <div className="flex items-center gap-2">
              {tournament.badge_1st_image_url && (
                <div className="w-8 h-8 border border-slate-700 bg-slate-800 flex items-center justify-center">
                  <img
                    src={tournament.badge_1st_image_url}
                    alt={tournament.badge_1st_label || '1st Place'}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {tournament.badge_2nd_image_url && (
                <div className="w-8 h-8 border border-slate-700 bg-slate-800 flex items-center justify-center">
                  <img
                    src={tournament.badge_2nd_image_url}
                    alt={tournament.badge_2nd_label || '2nd Place'}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {tournament.badge_3rd_image_url && (
                <div className="w-8 h-8 border border-slate-700 bg-slate-800 flex items-center justify-center">
                  <img
                    src={tournament.badge_3rd_image_url}
                    alt={tournament.badge_3rd_label || '3rd Place'}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

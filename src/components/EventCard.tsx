'use client'

import { Event } from '@/types/database'
import Link from 'next/link'
import CalendarToday from '@mui/icons-material/CalendarToday'
import People from '@mui/icons-material/People'
import { CountdownTimer } from './CountdownTimer'

interface EventCardProps {
  event: Event
  coverUrl?: string | null
  participantCount?: number
}

export function EventCard({ event, coverUrl, participantCount = 0 }: EventCardProps) {
  const isOngoing = event.status === 'ongoing'
  const isScheduled = event.status === 'scheduled'
  const startsAt = new Date(event.starts_at)
  const endsAt = new Date(event.ends_at)

  const timeLabels: Record<string, string> = {
    morning: 'Morning',
    noon: 'Noon',
    afternoon: 'Afternoon',
    evening: 'Evening',
    late_night: 'Late Night',
  }

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-colors overflow-hidden">
        <div className="flex gap-4 p-4">
          {/* Cover Image */}
          {coverUrl && (
            <div className="w-16 h-24 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600">
              <img src={coverUrl} alt={event.game_name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-title text-white mb-2 truncate">{event.game_name}</h3>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-2">
              {isOngoing && (
                <span className="px-2 py-1 bg-lime-600/20 border border-lime-600/50 text-lime-400 text-xs font-title">
                  Ongoing
                </span>
              )}
              {isScheduled && (
                <span className="px-2 py-1 bg-cyan-600/20 border border-cyan-600/50 text-cyan-400 text-xs font-title">
                  Scheduled
                </span>
              )}
              <span className="px-2 py-1 bg-slate-700/50 border border-slate-600/50 text-slate-400 text-xs">
                {timeLabels[event.time_slot] || event.time_slot}
              </span>
            </div>

            {/* Time Info */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <CalendarToday className="w-4 h-4" />
              <span>
                {startsAt.toLocaleDateString()} {startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Participant Count */}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <People className="w-4 h-4 text-cyan-400" />
              <span>{participantCount} participants</span>
            </div>

            {/* Countdown for scheduled events */}
            {isScheduled && (
              <div className="mt-2">
                <div className="text-xs text-slate-500 mb-1">Starts in:</div>
                <CountdownTimer targetDate={event.starts_at} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}


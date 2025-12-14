'use client'

import { Event } from '@/types/database'
import Link from 'next/link'
import CalendarToday from '@mui/icons-material/CalendarToday'
import People from '@mui/icons-material/People'
import { CountdownTimer } from './CountdownTimer'

interface EventCardProps {
  event: Event
  heroCoverUrl?: string | null
  squareIconUrl?: string | null
  participantCount?: number
}

export function EventCard({ event, heroCoverUrl, squareIconUrl, participantCount = 0 }: EventCardProps) {
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
    <Link href={`/events/${event.id}`} className="h-full flex">
      <div className="relative flex-1 min-h-[320px] overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-colors group">
        {/* Hero Image Background */}
        {heroCoverUrl && (
          <div className="absolute inset-0">
            <img 
              src={heroCoverUrl} 
              alt={event.game_name} 
              className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" 
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/70 to-slate-900/50" />
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-between p-4">
          {/* Top Section - Status Badges */}
          <div className="flex items-start justify-end">
            <div className="flex items-center gap-2 flex-wrap justify-end">
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
              <span className="px-2 py-1 bg-slate-700/80 border border-slate-600/50 text-slate-300 text-xs">
                {timeLabels[event.time_slot] || event.time_slot}
              </span>
            </div>
          </div>

          {/* Middle Section - Square Image and Game Title */}
          <div className="flex flex-col items-start justify-center flex-1 space-y-3">
            {/* Square Game Icon - Above title, left-aligned */}
            {squareIconUrl && (
              <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-slate-800/80 border-2 border-slate-700/50 rounded">
                <img 
                  src={squareIconUrl} 
                  alt={event.game_name} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* Game Name */}
            <h3 className="text-xl font-title text-white line-clamp-2">{event.game_name}</h3>
          </div>

          {/* Bottom Section - Game Info */}
          <div className="space-y-2">

            {/* Time Info */}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CalendarToday className="w-4 h-4 text-cyan-400" />
              <span>
                {startsAt.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} {startsAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endsAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Participant Count */}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <People className="w-4 h-4 text-cyan-400" />
              <span>{participantCount} participants</span>
            </div>

            {/* Countdown for scheduled events */}
            {isScheduled && (
              <div>
                <CountdownTimer targetDate={event.starts_at} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}


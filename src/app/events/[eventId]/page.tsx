'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Event, EventParticipant, Profile } from '@/types/database'
import Link from 'next/link'
import Refresh from '@mui/icons-material/Refresh'
import People from '@mui/icons-material/People'
import SportsEsports from '@mui/icons-material/SportsEsports'
import AccessTime from '@mui/icons-material/AccessTime'
import CheckCircle from '@mui/icons-material/CheckCircle'

interface EventWithDetails extends Event {
  participants: (EventParticipant & { profile: Profile })[]
  guides: any[]
  community: any
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isParticipating, setIsParticipating] = useState(false)
  const [participantStatus, setParticipantStatus] = useState<'in' | 'maybe' | 'declined' | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent()

    if (!eventId) return

    // Subscribe to realtime updates
    const participantsChannel = supabase
      .channel(`event_participants_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchEvent()
        }
      )
      .subscribe()

    const eventChannel = supabase
      .channel(`event_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        () => {
          fetchEvent()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(eventChannel)
    }
  }, [eventId, supabase])

  const fetchEvent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (data.event) {
        setEvent(data)
        setIsParticipating(data.participants.some((p: any) => p.user_id === user?.id))
        const userParticipant = data.participants.find((p: any) => p.user_id === user?.id)
        setParticipantStatus(userParticipant?.status || null)

        // Fetch cover image
        try {
          const coverResponse = await fetch(`/api/steamgriddb/game?id=${data.event.game_id}`)
          const coverData = await coverResponse.json()
          setCoverUrl(coverData.game?.coverThumb || coverData.game?.coverUrl || null)
        } catch {
          // Ignore cover fetch errors
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleParticipate = async (status: 'in' | 'maybe' | 'declined') => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setParticipantStatus(status)
        setIsParticipating(status === 'in')
        fetchEvent()
      }
    } catch (error) {
      console.error('Error updating participation:', error)
    }
  }

  const getTimeSlotLabel = (slot: string) => {
    const labels: Record<string, string> = {
      morning: 'Morning (10:00)',
      noon: 'Noon (12:00)',
      afternoon: 'Afternoon (15:00)',
      evening: 'Evening (18:00)',
      late_night: 'Late Night (21:00)',
    }
    return labels[slot] || slot
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Refresh className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
            <h1 className="text-2xl font-title text-white mb-4">Event Not Found</h1>
            <Link href="/events" className="text-cyan-400 hover:text-cyan-300">
              ← Back to Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const startsAt = new Date(event.starts_at)
  const endsAt = new Date(event.ends_at)
  const isUpcoming = event.status === 'scheduled' && now < startsAt
  const isOngoing = event.status === 'ongoing' || (now >= startsAt && now < endsAt)
  const isEnded = event.status === 'ended' || now >= endsAt

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/events" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
            ← Back to Events
          </Link>
        </div>

        {/* Event Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 mb-6">
          {/* Cover Image */}
          {coverUrl && (
            <div className="h-48 overflow-hidden bg-slate-700/50">
              <img src={coverUrl} alt={event.game_name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6">
            {/* Game Title */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-title text-white mb-2">{event.game_name}</h1>
                <Link
                  href={`/games/${event.game_id}`}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  View Game Page →
                </Link>
              </div>
              {coverUrl && (
                <div className="w-24 h-36 flex-shrink-0 ml-4 overflow-hidden bg-slate-700/50 border border-slate-600">
                  <img src={coverUrl} alt={event.game_name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 text-sm font-title ${
                  isOngoing
                    ? 'bg-app-green-600 text-white'
                    : isUpcoming
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isOngoing ? 'Ongoing' : isUpcoming ? 'Scheduled' : 'Ended'}
              </span>
            </div>

            {/* Event Time */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-slate-300">
                <AccessTime className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Starts:</strong> {formatDate(event.starts_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <AccessTime className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Ends:</strong> {formatDate(event.ends_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <SportsEsports className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Time Slot:</strong> {getTimeSlotLabel(event.time_slot)}
                </span>
              </div>
            </div>

            {/* Countdown */}
            {isUpcoming && (
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Event starts in:</p>
                <CountdownTimer targetDate={event.starts_at} />
              </div>
            )}
            {isOngoing && (
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Event ends in:</p>
                <CountdownTimer targetDate={event.ends_at} />
              </div>
            )}

            {/* Participation Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <People className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-300">
                  <strong>{event.total_votes}</strong> votes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-app-green-400" />
                <span className="text-slate-300">
                  <strong>{event.participants.length}</strong> confirmed
                </span>
              </div>
            </div>

            {/* Participation Actions */}
            {user && (
              <div className="flex gap-3">
                {participantStatus !== 'in' && (
                  <button
                    onClick={() => handleParticipate('in')}
                    className="px-4 py-2 bg-app-green-600 hover:bg-app-green-500 text-white font-title text-sm transition-colors relative"
                  >
                    {/* Corner brackets */}
                    <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                    <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                    <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                    <span className="relative z-10">I'll be in</span>
                  </button>
                )}
                {participantStatus === 'in' && (
                  <div className="px-4 py-2 bg-app-green-600/50 text-white font-title text-sm">
                    ✓ You're in!
                  </div>
                )}
                {participantStatus && (
                  <button
                    onClick={() => handleParticipate('maybe')}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
                  >
                    Maybe
                  </button>
                )}
              </div>
            )}
            {!user && (
              <Link
                href="/auth/login"
                className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-title text-sm transition-colors relative"
              >
                Sign in to participate
              </Link>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="bg-slate-800/50 border border-slate-700/50 mb-6 p-6">
          <h2 className="text-xl font-title text-white mb-4">
            Participants ({event.participants.length})
          </h2>
          {event.participants.length === 0 ? (
            <p className="text-slate-400">No confirmed participants yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {event.participants.map((participant) => (
                <Link
                  key={participant.id}
                  href={`/u/${participant.profile.id}`}
                  className="flex items-center gap-2 p-2 hover:bg-slate-700/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full overflow-hidden bg-slate-700 border ${
                    participant.profile.plan_tier === 'pro' && 
                    (!participant.profile.plan_expires_at || new Date(participant.profile.plan_expires_at) > new Date())
                      ? 'border-yellow-400' 
                      : 'border-slate-600'
                  }`}>
                    {participant.profile.avatar_url ? (
                      <img
                        src={participant.profile.avatar_url}
                        alt={participant.profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                    )}
                  </div>
                  <span className="text-sm text-slate-300 truncate">
                    {participant.profile.display_name || participant.profile.username}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Guides */}
        {event.guides.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 p-6">
            <h2 className="text-xl font-title text-white mb-4">Guides</h2>
            <div className="space-y-2">
              {event.guides.map((guide: any) => (
                <a
                  key={guide.id}
                  href={guide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 transition-colors"
                >
                  <h3 className="text-white font-medium mb-1">{guide.title}</h3>
                  {guide.og_description && (
                    <p className="text-sm text-slate-400">{guide.og_description}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


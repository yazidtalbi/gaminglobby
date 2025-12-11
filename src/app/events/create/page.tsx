'use client'

import { useState, useEffect } from 'react'
import { GameSearch } from '@/components/GameSearch'
import { DayPreferencePicker } from '@/components/DayPreferencePicker'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DayPreference } from '@/components/DayPreferencePicker'
import Refresh from '@mui/icons-material/Refresh'
import ArrowBack from '@mui/icons-material/ArrowBack'
import Link from 'next/link'

const timeSlots = [
  { value: 'afternoon', label: 'Afternoon (15:00)' },
  { value: 'late_night', label: 'Late Night (21:00)' },
]

export default function CreateEventPage() {
  const { user, loading } = useAuth()
  const { isPro } = usePremium()
  const router = useRouter()
  const supabase = createClient()

  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayPreference | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('afternoon')
  const [eventDate, setEventDate] = useState<string>('')
  const [eventTime, setEventTime] = useState<string>('15:00')
  const [status, setStatus] = useState<'scheduled' | 'ongoing'>('scheduled')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rounds, setRounds] = useState<any[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')

  useEffect(() => {
    // Only redirect if loading is complete and user is still null
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    // Check if user is premium
    if (!loading && user && !isPro) {
      router.push('/billing')
      return
    }

    // Only fetch rounds if user is loaded and premium
    if (!loading && user && isPro) {
      // Fetch rounds for selection
      const fetchRounds = async () => {
        const { data } = await supabase
          .from('weekly_rounds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (data && data.length > 0) {
          setRounds(data)
          setSelectedRoundId(data[0].id) // Default to most recent
        }
      }

      fetchRounds()
    }
  }, [user, loading, router, supabase])

  const handleGameSelect = (game: { id: string; name: string }) => {
    setSelectedGame(game)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedGame) {
      setError('Please select a game')
      return
    }

    if (!selectedDay) {
      setError('Please select a day')
      return
    }

    if (!selectedRoundId) {
      setError('Please select a round')
      return
    }

    // Parse date and time
    let startsAt: Date
    if (eventDate && eventTime) {
      // Use custom date/time if provided
      const [hours, minutes] = eventTime.split(':').map(Number)
      startsAt = new Date(eventDate)
      startsAt.setHours(hours, minutes, 0, 0)
    } else {
      // Use day preference and time slot
      const dayNumbers: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      }

      const targetDay = dayNumbers[selectedDay] || 6
      const now = new Date()
      const currentDay = now.getDay()
      let daysUntilTarget = targetDay - currentDay

      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7
      }

      startsAt = new Date(now)
      startsAt.setDate(now.getDate() + daysUntilTarget)

      const times: Record<string, number> = {
        afternoon: 15,
        late_night: 21,
      }
      startsAt.setHours(times[selectedTimeSlot] || 15, 0, 0, 0)
    }

    const endsAt = new Date(startsAt)
    endsAt.setHours(endsAt.getHours() + 6) // 6-hour event window

    setIsCreating(true)

    try {
      // Ensure community exists
      let { data: community } = await supabase
        .from('game_event_communities')
        .select('*')
        .eq('game_id', selectedGame.id)
        .single()

      if (!community) {
        const { data: newCommunity, error: communityError } = await supabase
          .from('game_event_communities')
          .insert({
            game_id: selectedGame.id,
            game_name: selectedGame.name,
            created_from_round_id: selectedRoundId,
          })
          .select()
          .single()

        if (communityError) {
          throw new Error(`Failed to create community: ${communityError.message}`)
        }
        community = newCommunity
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          game_id: selectedGame.id,
          game_name: selectedGame.name,
          community_id: community.id,
          round_id: selectedRoundId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          time_slot: selectedTimeSlot,
          day_slot: selectedDay,
          status: status,
          total_votes: 0,
        })
        .select()
        .single()

      if (eventError) {
        throw new Error(`Failed to create event: ${eventError.message}`)
      }

      // Redirect to event page
      router.push(`/events/${event.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
      setIsCreating(false)
    }
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Refresh className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  // Redirect if not authenticated (handled by useEffect, but show nothing while redirecting)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ArrowBack className="w-4 h-4" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-title text-white">Create Event</h1>
          <p className="text-slate-400 mt-2">Manually create a new community event</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/50 p-6 space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-title text-white mb-2">
              Game <span className="text-red-400">*</span>
            </label>
            {selectedGame ? (
              <div className="flex items-center justify-between bg-slate-700/50 border border-slate-600/50 p-4">
                <div>
                  <p className="text-white font-title">{selectedGame.name}</p>
                  <p className="text-xs text-slate-400">ID: {selectedGame.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGame(null)}
                  className="text-sm text-slate-400 hover:text-slate-300"
                >
                  Change
                </button>
              </div>
            ) : (
              <GameSearch
                placeholder="Search for a game..."
                size="md"
                navigateOnSelect={false}
                onSelect={(game) => handleGameSelect({ id: game.id.toString(), name: game.name })}
              />
            )}
          </div>

          {/* Round Selection */}
          <div>
            <label className="block text-sm font-title text-white mb-2">
              Round <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
              required
            >
              {rounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.week_key} ({round.status})
                </option>
              ))}
            </select>
          </div>

          {/* Date/Time Selection Method */}
          <div>
            <label className="block text-sm font-title text-white mb-2">Date & Time Selection</label>
            <div className="space-y-4">
              {/* Option 1: Use day preference and time slot */}
              <div className="bg-slate-700/30 border border-slate-600/30 p-4">
                <p className="text-sm text-slate-300 mb-3">Option 1: Use Day & Time Slot</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Day</label>
                    <DayPreferencePicker
                      value={selectedDay}
                      onChange={setSelectedDay}
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Time Slot</label>
                    <div className="flex gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot.value)}
                          disabled={isCreating}
                          className={`px-4 py-2 text-sm font-title transition-colors relative ${
                            selectedTimeSlot === slot.value
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {/* Corner brackets */}
                          <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
                          <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
                          <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
                          <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
                          <span className="relative z-10">{slot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Custom date/time */}
              <div className="bg-slate-700/30 border border-slate-600/30 p-4">
                <p className="text-sm text-slate-300 mb-3">Option 2: Custom Date & Time</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      disabled={isCreating}
                      className="w-full bg-slate-700/50 border border-slate-600/50 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Time</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      disabled={isCreating}
                      className="w-full bg-slate-700/50 border border-slate-600/50 text-white px-4 py-2 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  If provided, this will override the day/time slot selection above
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-title text-white mb-2">Status</label>
            <div className="flex gap-2">
              {(['scheduled', 'ongoing'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  disabled={isCreating}
                  className={`px-4 py-2 text-sm font-title transition-colors relative ${
                    status === s
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
                  <span className="relative z-10 capitalize">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isCreating || !selectedGame || !selectedDay}
              className="px-6 py-3 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-title text-sm transition-colors relative"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
              <span className="relative z-10 flex items-center gap-2">
                {isCreating ? (
                  <>
                    <Refresh className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </span>
            </button>

            <Link
              href="/events"
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
              <span className="relative z-10">Cancel</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}


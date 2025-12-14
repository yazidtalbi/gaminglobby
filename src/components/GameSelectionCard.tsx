'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { VoteDistribution } from '@/components/VoteDistribution'
import CalendarToday from '@mui/icons-material/CalendarToday'
import AccessTime from '@mui/icons-material/AccessTime'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Refresh from '@mui/icons-material/Refresh'

interface GameSelectionCardProps {
  selection: {
    id: string
    game_id: string
    game_name: string
    selection_deadline: string
    vote_count: number
    day_distribution: Record<string, number>
    time_distribution: Record<string, number>
  }
  userVote?: {
    day_pref: string
    time_pref: string
  } | null
  onVoteUpdate?: () => void
  isFounder?: boolean
}

const days = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

const timeSlots = [
  { value: 'morning', label: 'Morning' },
  { value: 'noon', label: 'Noon' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'late_night', label: 'Late Night' },
]

export function GameSelectionCard({ selection, userVote, onVoteUpdate, isFounder = false }: GameSelectionCardProps) {
  const { user } = useAuth()
  const [selectedDay, setSelectedDay] = useState<string>(userVote?.day_pref || '')
  const [selectedTime, setSelectedTime] = useState<string>(userVote?.time_pref || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)

  const deadline = new Date(selection.selection_deadline)
  const isDeadlinePassed = deadline < new Date()
  const canVote = user && !isDeadlinePassed

  const handleSubmit = async () => {
    if (!selectedDay || !selectedTime) {
      alert('Please select both a day and time slot')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/events/selections/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection_id: selection.id,
          day_pref: selectedDay,
          time_pref: selectedTime,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onVoteUpdate?.()
      } else {
        alert(data.error || 'Failed to submit selection')
      }
    } catch (error) {
      console.error('Error submitting selection:', error)
      alert('Failed to submit selection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get most popular day/time from distribution
  const mostPopularDay = Object.entries(selection.day_distribution || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostPopularTime = Object.entries(selection.time_distribution || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const handleCreateEvent = async () => {
    if (!mostPopularDay || !mostPopularTime) {
      alert('No votes found. Cannot create event without day and time preferences.')
      return
    }

    if (!confirm(`Create event for ${selection.game_name} on ${mostPopularDay} at ${mostPopularTime.replace('_', ' ')}?`)) {
      return
    }

    setIsCreatingEvent(true)
    try {
      const response = await fetch('/api/events/selections/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection_id: selection.id,
          day: mostPopularDay,
          time_slot: mostPopularTime,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Event created successfully for ${selection.game_name}!`)
        onVoteUpdate?.()
      } else {
        alert(data.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setIsCreatingEvent(false)
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-title text-white mb-2">{selection.game_name}</h3>
        <p className="text-sm text-slate-400">
          {selection.vote_count} {selection.vote_count === 1 ? 'vote' : 'votes'}
        </p>
      </div>

      {/* Vote Distribution Charts */}
      {selection.vote_count > 0 && (
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <VoteDistribution
            distribution={selection.time_distribution as any}
            dayDistribution={selection.day_distribution as any}
            totalVotes={selection.vote_count}
          />
        </div>
      )}

      {isDeadlinePassed ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Selection deadline has passed.</p>
          {mostPopularDay && mostPopularTime ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CalendarToday className="w-4 h-4 text-cyan-400" />
                  <span className="capitalize">{mostPopularDay}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <AccessTime className="w-4 h-4 text-cyan-400" />
                  <span className="capitalize">{mostPopularTime.replace('_', ' ')}</span>
                </div>
              </div>
              {isFounder && (
                <button
                  onClick={handleCreateEvent}
                  disabled={isCreatingEvent}
                  className="w-full px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingEvent ? (
                    <>
                      <Refresh className="w-4 h-4 animate-spin" />
                      Creating Event...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Event
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No votes received for this game.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Day Selection */}
          <div>
            <label className="block text-sm font-title text-slate-300 mb-2 uppercase">
              Select Day
            </label>
            <div className="grid grid-cols-7 gap-2">
              {days.map(day => (
                <button
                  key={day.value}
                  onClick={() => canVote && setSelectedDay(day.value)}
                  disabled={!canVote}
                  className={`px-3 py-2 text-xs font-title border transition-colors ${
                    selectedDay === day.value
                      ? 'bg-cyan-400 text-slate-900 border-cyan-400'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:border-cyan-400/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {day.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-sm font-title text-slate-300 mb-2 uppercase">
              Select Time
            </label>
            <div className="grid grid-cols-5 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time.value}
                  onClick={() => canVote && setSelectedTime(time.value)}
                  disabled={!canVote}
                  className={`px-3 py-2 text-xs font-title border transition-colors ${
                    selectedTime === time.value
                      ? 'bg-cyan-400 text-slate-900 border-cyan-400'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:border-cyan-400/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          {canVote && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDay || !selectedTime}
              className="w-full px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : userVote ? 'Update Selection' : 'Submit Selection'}
            </button>
          )}

          {!user && (
            <p className="text-sm text-slate-400 text-center">Sign in to vote</p>
          )}
        </div>
      )}
    </div>
  )
}

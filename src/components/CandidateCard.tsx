'use client'

import { useState } from 'react'
import { WeeklyGameCandidate } from '@/types/database'
import { TimePreference, TimePreferencePicker } from './TimePreferencePicker'
import { DayPreference, DayPreferencePicker } from './DayPreferencePicker'
import { VoteDistribution } from './VoteDistribution'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Refresh from '@mui/icons-material/Refresh'
import People from '@mui/icons-material/People'

interface CandidateCardProps {
  candidate: WeeklyGameCandidate & {
    timeDistribution?: Record<TimePreference, number>
    dayDistribution?: Record<DayPreference, number>
  }
  userVote: { time_pref: TimePreference; day_pref?: DayPreference } | null
  roundStatus: 'open' | 'locked' | 'processed'
  coverUrl?: string | null
  onVoteUpdate?: () => void
}

export function CandidateCard({
  candidate,
  userVote,
  roundStatus,
  coverUrl,
  onVoteUpdate,
}: CandidateCardProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [selectedTimePref, setSelectedTimePref] = useState<TimePreference | null>(
    userVote?.time_pref || null
  )
  const [selectedDayPref, setSelectedDayPref] = useState<DayPreference | null>(
    userVote?.day_pref || null
  )
  const [isVoting, setIsVoting] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const handleVote = async (timePref: TimePreference, dayPref: DayPreference) => {
    if (!user || roundStatus !== 'open' || !dayPref) return

    setIsVoting(true)
    try {
      const response = await fetch('/api/events/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          time_pref: timePref,
          day_pref: dayPref,
        }),
      })

      if (response.ok) {
        setSelectedTimePref(timePref)
        setSelectedDayPref(dayPref)
        setShowTimePicker(false)
        onVoteUpdate?.()
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleVoteCountClick = async () => {
    if (!user || roundStatus !== 'open' || isVoting) return

    if (userVote) {
      // Unvote: Delete the vote
      setIsVoting(true)
      try {
        const response = await fetch('/api/events/votes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_id: candidate.id,
          }),
        })

        if (response.ok) {
          setSelectedTimePref(null)
          onVoteUpdate?.()
        }
      } catch (error) {
        console.error('Error unvoting:', error)
      } finally {
        setIsVoting(false)
      }
    } else {
      // Vote: Show time picker
      setShowTimePicker(true)
    }
  }

  const canVote = user && roundStatus === 'open'

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="flex gap-4 p-4 relative">
        {/* Cover Image */}
        {coverUrl && (
          <div className="w-16 h-24 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600">
            <img src={coverUrl} alt={candidate.game_name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pr-24">
          <h3 className="text-lg font-title text-white mb-2 truncate">{candidate.game_name}</h3>

          {/* Vote Count - Positioned far right, clickable, centered vertically */}
          {canVote && (
            <button
              onClick={handleVoteCountClick}
              disabled={isVoting}
              className={`absolute top-1/2 right-4 -translate-y-1/2 flex items-center justify-center gap-1 w-20 px-3 py-2 bg-slate-800 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                userVote 
                  ? 'border-cyan-400 hover:border-cyan-300' 
                  : 'border-cyan-400/30 hover:border-cyan-400/50'
              }`}
              title={userVote ? 'Click to remove your vote' : 'Click to vote'}
            >
              <span className="text-3xl font-title text-cyan-400">{candidate.total_votes ?? 0}</span>
              {/* Filled triangle */}
              <svg
                className="w-3 h-3 text-cyan-400 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </button>
          )}
          {!canVote && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center justify-center gap-1 w-20">
              <span className="text-3xl font-title text-cyan-400">{candidate.total_votes ?? 0}</span>
              {/* Filled triangle */}
              <svg
                className="w-3 h-3 text-cyan-400 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </div>
          )}

          {/* Time and Day Distribution */}
          {(candidate.timeDistribution || candidate.dayDistribution) && (
            <div className="mb-4 mr-24">
              <VoteDistribution
                distribution={candidate.timeDistribution || {}}
                dayDistribution={candidate.dayDistribution}
                totalVotes={candidate.total_votes}
              />
            </div>
          )}

          {/* Vote Picker (shown when clicking vote button) */}
          {canVote && showTimePicker && (
            <div className="space-y-4">
              {/* Day selection first */}
              <div className="space-y-2">
                <p className="text-sm text-slate-300">Choose your preferred day:</p>
                <DayPreferencePicker
                  value={selectedDayPref}
                  onChange={(day) => setSelectedDayPref(day)}
                  disabled={isVoting}
                />
              </div>

              {/* Time selection second */}
              {selectedDayPref && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Choose your preferred time:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['afternoon', 'late_night'] as TimePreference[]).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => !isVoting && setSelectedTimePref(pref)}
                        disabled={isVoting}
                        className={`px-4 py-2 text-sm font-title transition-colors relative ${
                          selectedTimePref === pref
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {/* Corner brackets */}
                        <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
                        <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
                        <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
                        <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
                        <span className="relative z-10">
                          {pref === 'afternoon' ? 'Afternoon (15:00)' : 'Late Night (21:00)'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTimePref && selectedDayPref && (
                <button
                  onClick={() => handleVote(selectedTimePref, selectedDayPref)}
                  disabled={isVoting}
                  className="px-4 py-2 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10">
                    {isVoting ? 'Voting...' : 'Confirm Vote'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowTimePicker(false)
                  setSelectedTimePref(null)
                  setSelectedDayPref(null)
                }}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}

          {!canVote && roundStatus === 'locked' && (
            <p className="text-sm text-slate-500">Voting closed</p>
          )}
        </div>
      </div>
    </div>
  )
}


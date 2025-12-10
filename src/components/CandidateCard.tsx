'use client'

import { useState } from 'react'
import { WeeklyGameCandidate } from '@/types/database'
import { TimePreference, TimePreferencePicker } from './TimePreferencePicker'
import { VoteDistribution } from './VoteDistribution'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Refresh from '@mui/icons-material/Refresh'
import People from '@mui/icons-material/People'

interface CandidateCardProps {
  candidate: WeeklyGameCandidate & {
    timeDistribution?: Record<TimePreference, number>
  }
  userVote: { time_pref: TimePreference } | null
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
  const [isVoting, setIsVoting] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const handleVote = async (timePref: TimePreference) => {
    if (!user || roundStatus !== 'open') return

    setIsVoting(true)
    try {
      const response = await fetch('/api/events/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          time_pref: timePref,
        }),
      })

      if (response.ok) {
        setSelectedTimePref(timePref)
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

          {/* Time Distribution */}
          {candidate.timeDistribution && (
            <div className="mb-4 mr-24">
              <VoteDistribution
                distribution={candidate.timeDistribution}
                totalVotes={candidate.total_votes}
              />
            </div>
          )}

          {/* Time Picker (shown when clicking vote button) */}
          {canVote && showTimePicker && (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">Choose your preferred time:</p>
              <TimePreferencePicker
                value={selectedTimePref}
                onChange={handleVote}
                disabled={isVoting}
              />
              <button
                onClick={() => setShowTimePicker(false)}
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


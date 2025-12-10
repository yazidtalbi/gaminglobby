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

  const canVote = user && roundStatus === 'open'

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Cover Image */}
        {coverUrl && (
          <div className="w-16 h-24 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600">
            <img src={coverUrl} alt={candidate.game_name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-title text-white mb-2 truncate">{candidate.game_name}</h3>

          {/* Vote Count */}
          <div className="flex items-center gap-2 mb-3">
            <People className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">
              <span className="font-semibold">{candidate.total_votes}</span> votes
            </span>
          </div>

          {/* Time Distribution */}
          {candidate.timeDistribution && (
            <div className="mb-4">
              <VoteDistribution
                distribution={candidate.timeDistribution}
                totalVotes={candidate.total_votes}
              />
            </div>
          )}

          {/* User Vote Status */}
          {userVote && (
            <div className="mb-3">
              <p className="text-xs text-slate-400">
                Your preference: <span className="text-cyan-400">{userVote.time_pref}</span>
              </p>
            </div>
          )}

          {/* Vote Button */}
          {canVote && (
            <div>
              {!showTimePicker ? (
                <button
                  onClick={() => setShowTimePicker(true)}
                  disabled={isVoting}
                  className="px-4 py-2 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isVoting ? (
                      <>
                        <Refresh className="w-4 h-4 animate-spin" />
                        Voting...
                      </>
                    ) : userVote ? (
                      'Update Vote'
                    ) : (
                      "I'll be in"
                    )}
                  </span>
                </button>
              ) : (
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


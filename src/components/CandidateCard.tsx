'use client'

import { useState } from 'react'
import { WeeklyGameCandidate } from '@/types/database'
import { VoteDistribution } from './VoteDistribution'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Refresh from '@mui/icons-material/Refresh'
import People from '@mui/icons-material/People'

interface CandidateCardProps {
  candidate: WeeklyGameCandidate & {
    timeDistribution?: Record<string, number>
    dayDistribution?: Record<string, number>
  }
  userVote: boolean | null
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
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async () => {
    if (!user || roundStatus !== 'open') return

    setIsVoting(true)
    try {
      const response = await fetch('/api/events/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
        }),
      })

      if (response.ok) {
        onVoteUpdate?.()
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleUnvote = async () => {
    if (!user || roundStatus !== 'open' || isVoting) return

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
        onVoteUpdate?.()
      }
    } catch (error) {
      console.error('Error unvoting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const canVote = user && roundStatus === 'open'

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="flex gap-3 p-2.5 relative items-center">
        {/* Cover Image - Square version (smaller) */}
        {coverUrl && (
          <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600">
            <img src={coverUrl} alt={candidate.game_name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content - Centered vertically */}
        <div className="flex-1 min-w-0 pr-16 flex items-center">
          <h3 className="text-base font-title text-white truncate">{candidate.game_name}</h3>

          {/* Vote Count and Button - Positioned far right, centered vertically (much smaller) */}
          {canVote ? (
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex flex-col items-center gap-1">
              <button
                onClick={userVote ? handleUnvote : handleVote}
                disabled={isVoting}
                className={`flex items-center justify-center gap-0.5 w-12 px-1.5 py-1 bg-slate-800 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  userVote 
                    ? 'border-cyan-400 hover:border-cyan-300' 
                    : 'border-cyan-400/30 hover:border-cyan-400/50'
                }`}
                title={userVote ? 'Click to remove your vote' : 'Click to vote'}
              >
                <span className="text-sm font-title text-cyan-400">{candidate.total_votes ?? 0}</span>
                {/* Filled triangle (smaller) */}
                <svg
                  className="w-2 h-2 text-cyan-400 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 22h20L12 2z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center gap-0.5 w-12">
              <span className="text-sm font-title text-cyan-400">{candidate.total_votes ?? 0}</span>
              {/* Filled triangle (smaller) */}
              <svg
                className="w-2 h-2 text-cyan-400 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


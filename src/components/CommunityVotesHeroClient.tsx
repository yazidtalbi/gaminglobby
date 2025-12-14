'use client'

import { useState, useEffect } from 'react'
import { WeeklyRound, WeeklyGameCandidate } from '@/types/database'
import { CountdownTimer } from './CountdownTimer'
import { CandidateCard } from './CandidateCard'
import Link from 'next/link'
import ArrowForward from '@mui/icons-material/ArrowForward'

interface CommunityVotesHeroClientProps {
  round: WeeklyRound
  candidates: WeeklyGameCandidate[]
  userVotes: Record<string, boolean>
}

export function CommunityVotesHeroClient({ round, candidates, userVotes: initialUserVotes }: CommunityVotesHeroClientProps) {
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>(initialUserVotes)
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

  // Load cover images lazily (non-blocking)
  useEffect(() => {
    const loadCoverImages = async () => {
      const coverPromises = candidates.map(async (candidate: WeeklyGameCandidate) => {
        try {
          const coverResponse = await fetch(`/api/steamgriddb/game?id=${candidate.game_id}`)
          const coverData = await coverResponse.json()
          return {
            gameId: candidate.game_id,
            coverUrl: coverData.game?.squareCoverThumb || coverData.game?.squareCoverUrl || coverData.game?.coverThumb || coverData.game?.coverUrl || null,
          }
        } catch {
          return { gameId: candidate.game_id, coverUrl: null }
        }
      })

      const covers = await Promise.all(coverPromises)
      setCoverUrls(
        covers.reduce((acc, { gameId, coverUrl }) => {
          if (coverUrl) acc[gameId] = coverUrl
          return acc
        }, {} as Record<string, string>)
      )
    }

    loadCoverImages()
  }, [candidates])

  const handleVoteUpdate = async () => {
    // Refresh user votes after voting
    const response = await fetch('/api/events/votes/hero')
    const data = await response.json()
    if (data.userVotes) {
      setUserVotes(data.userVotes)
    }
  }

  const weekLabel = round.week_key

  return (
    <div className="h-full flex flex-col">
      {/* Header 
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-title text-white mb-2">
            Weekly Community Vote
          </h2>
          <p className="text-slate-400">Week of {weekLabel}</p>
        </div>
        <Link
          href="/events"
          className="text-cyan-400 hover:text-cyan-300 font-title text-sm flex items-center gap-2 transition-colors"
        >
          View All
          <ArrowForward className="w-4 h-4" />
        </Link>
      </div>*/}

      {/* Card Container */}
      <div className="bg-slate-800/50 border border-slate-700/50 p-6 flex-1 flex flex-col">
          {/* Voting Section */}
          <div className="w-full flex-1 flex flex-col">


            {/* Top Candidates */}
            {candidates.length > 0 ? (
              <div className="space-y-3 flex-1">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    userVote={userVotes[candidate.id] || null}
                    roundStatus={round.status}
                    coverUrl={coverUrls[candidate.game_id]}
                    onVoteUpdate={handleVoteUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center flex-1">
                <p className="text-slate-400">No games added yet. Be the first to add one!</p>
                <Link
                  href="/events"
                  className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 font-title text-sm"
                >
                  Add a game →
                </Link>
              </div>
            )}

            {/* Hero Section */}
            <div className="mt-6 mt-auto">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
              
                  {round.status === 'open' && (
                    <div>
                      <CountdownTimer targetDate={round.voting_ends_at} />
                    </div>
                  )}
                </div>
                <Link
                  href="/events"
                  className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors relative whitespace-nowrap"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-slate-900" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-slate-900" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-slate-900" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-slate-900" />
                  <span className="relative z-10">Go to Events</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

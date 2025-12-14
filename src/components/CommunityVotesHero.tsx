'use client'

import { useState, useEffect } from 'react'
import { WeeklyRound, WeeklyGameCandidate } from '@/types/database'
import { CountdownTimer } from './CountdownTimer'
import { CandidateCard } from './CandidateCard'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Refresh from '@mui/icons-material/Refresh'

export function CommunityVotesHero() {
  const { user } = useAuth()
  const [round, setRound] = useState<WeeklyRound | null>(null)
  const [candidates, setCandidates] = useState<WeeklyGameCandidate[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

  const fetchRoundData = async () => {
    setIsLoading(true)
    try {
      // Use lightweight hero endpoint - only fetches voting data, not full events page data
      const response = await fetch('/api/events/votes/hero')
      const data = await response.json()

      if (data.round) {
        setRound(data.round)
        setUserVotes(data.userVotes || {})
        setCandidates(data.candidates || [])

        // Fetch square cover images for candidates (like sidebar)
        const coverPromises = (data.candidates || []).map(async (candidate: WeeklyGameCandidate) => {
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
      } else {
        setRound(null)
        setCandidates([])
        setUserVotes({})
        setCoverUrls({})
      }
    } catch (error) {
      console.error('Error fetching round data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoundData()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
        <Refresh className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
      </div>
    )
  }

  if (!round || round.status !== 'open') {
    return null // Don't show if no active round
  }

  const weekLabel = round.week_key

  return (
    <section className="py-4 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/50 border border-slate-700/50 p-6">
          {/* Voting Section */}
          <div className="w-full">
              {/* Hero Section */}
              <div className="mb-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-title text-white mb-2">
                      Vote for your favorite games
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Help decide which games will become community events this week
                    </p>
                    {round.status === 'open' && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Voting ends in:</p>
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

              {/* Top Candidates */}
              {candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      userVote={userVotes[candidate.id] || null}
                      roundStatus={round.status}
                      coverUrl={coverUrls[candidate.game_id]}
                      onVoteUpdate={fetchRoundData}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
                  <p className="text-slate-400">No games added yet. Be the first to add one!</p>
                  <Link
                    href="/events"
                    className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 font-title text-sm"
                  >
                    Add a game →
                  </Link>
                </div>
              )}
          </div>
        </div>
      </div>
    </section>
  )
}

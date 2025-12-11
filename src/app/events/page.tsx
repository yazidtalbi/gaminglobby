'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameSearch } from '@/components/GameSearch'
import { CandidateCard } from '@/components/CandidateCard'
import { CountdownTimer } from '@/components/CountdownTimer'
import { TimePreference } from '@/components/TimePreferencePicker'
import { DayPreference } from '@/components/DayPreferencePicker'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { createClient } from '@/lib/supabase/client'
import { WeeklyRound, WeeklyGameCandidate } from '@/types/database'
import Refresh from '@mui/icons-material/Refresh'
import Add from '@mui/icons-material/Add'
import Link from 'next/link'

interface CandidateWithDistribution extends WeeklyGameCandidate {
  timeDistribution?: Record<string, number>
}

export default function EventsPage() {
  const { user } = useAuth()
  const { isPro } = usePremium()
  const supabase = createClient()
  const [round, setRound] = useState<WeeklyRound | null>(null)
  const [candidates, setCandidates] = useState<CandidateWithDistribution[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, { time_pref: TimePreference; day_pref?: DayPreference }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

  const fetchRoundData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/events/rounds/current')
      const data = await response.json()

      if (data.round) {
        setRound(data.round)
        setUserVotes(
          (data.userVotes || []).reduce(
            (acc: Record<string, { time_pref: TimePreference; day_pref?: DayPreference }>, vote: any) => {
              acc[vote.candidate_id] = { 
                time_pref: vote.time_pref as TimePreference,
                day_pref: vote.day_pref as DayPreference | undefined
              }
              return acc
            },
            {}
          )
        )
      }

      // Fetch candidates with distribution
      const candidatesResponse = await fetch('/api/events/candidates')
      const candidatesData = await candidatesResponse.json()
      setCandidates(candidatesData.candidates || [])

      // Fetch cover images for candidates
      const coverPromises = (candidatesData.candidates || []).map(async (candidate: WeeklyGameCandidate) => {
        try {
          const coverResponse = await fetch(`/api/steamgriddb/game?id=${candidate.game_id}`)
          const coverData = await coverResponse.json()
          return {
            gameId: candidate.game_id,
            coverUrl: coverData.game?.coverThumb || coverData.game?.coverUrl || null,
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
    } catch (error) {
      console.error('Error fetching round data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoundData()
  }, [])

  useEffect(() => {
    if (!round) return

    // Subscribe to realtime updates
    const candidatesChannel = supabase
      .channel(`weekly_candidates_${round.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_game_candidates',
          filter: `round_id=eq.${round.id}`,
        },
        () => {
          fetchRoundData()
        }
      )
      .subscribe()

    const votesChannel = supabase
      .channel(`weekly_votes_${round.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_game_votes',
          filter: `round_id=eq.${round.id}`,
        },
        () => {
          fetchRoundData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(candidatesChannel)
      supabase.removeChannel(votesChannel)
    }
  }, [round?.id])

  const handleGameSelect = async (gameId: string, gameName: string) => {
    if (!user) {
      // Show login prompt
      return
    }

    try {
      const response = await fetch('/api/events/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, game_name: gameName }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh the candidates list
        fetchRoundData()
      } else {
        console.error('Error adding candidate:', data.error || 'Unknown error')
        alert(data.error || 'Failed to add game to voting list')
      }
    } catch (error) {
      console.error('Error adding candidate:', error)
      alert('Failed to add game. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Refresh className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!round) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
            <h1 className="text-2xl font-title text-white mb-4">No Voting Round Active</h1>
            <p className="text-slate-400">
              There's no active weekly voting round right now. Check back soon!
            </p>
          </div>
        </div>
      </div>
    )
  }

  const weekLabel = round.week_key
  const isVotingOpen = round.status === 'open'

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">
          {/* Left Sidebar - Sticky Weekly Community Vote Card */}
          <div className="w-80 flex-shrink-0 sticky top-24">
            <div className="bg-slate-800/50 border border-slate-700/50">
              <div className="p-6">
                <h1 className="text-3xl font-title text-white mb-2">Weekly Community Vote</h1>
                <p className="text-slate-400 mb-4">Week of {weekLabel}</p>

                {isVotingOpen ? (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Voting ends in:</p>
                    <CountdownTimer targetDate={round.voting_ends_at} />
                  </div>
                ) : (
                  <p className="text-slate-500">Voting is closed. Events will be announced soon.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Search and Candidates */}
          <div className="flex-1 min-w-0">
            {/* Add Game Section */}
            {isVotingOpen && (
              <div className="bg-slate-800/50 border border-slate-700/50 mb-6 p-6">
                <h2 className="text-xl font-title text-white mb-4">Add a Game to Vote</h2>
                <GameSearch
                  placeholder="Search for a game to add..."
                  size="md"
                  navigateOnSelect={false}
                  onSelect={(game) => handleGameSelect(game.id.toString(), game.name)}
                />
                {!user && (
                  <p className="text-sm text-slate-500 mt-4">
                    <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300">
                      Sign in
                    </Link>{' '}
                    to add games and vote
                  </p>
                )}
              </div>
            )}

            {/* Candidates List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-title text-white mb-4">
                Candidates ({candidates.length})
              </h2>

              {candidates.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
                  <p className="text-slate-400">No games added yet. Be the first to add one!</p>
                </div>
              ) : (
                candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    userVote={userVotes[candidate.id] || null}
                    roundStatus={round.status}
                    coverUrl={coverUrls[candidate.game_id]}
                    onVoteUpdate={fetchRoundData}
                  />
                ))
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/events/upcoming"
                className="text-cyan-400 hover:text-cyan-300 font-title"
              >
                View Upcoming Events →
              </Link>
              {isPro ? (
                <Link
                  href="/events/create"
                  className="px-4 py-2 bg-app-green-600 hover:bg-app-green-500 text-white font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
                  <span className="relative z-10 flex items-center gap-2">
                    <Add className="w-4 h-4" />
                    Create Event
                  </span>
                </Link>
              ) : (
                <Link
                  href="/billing"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-title text-sm transition-colors relative"
                >
                  {/* Corner brackets */}
                  <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-slate-900" />
                  <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-slate-900" />
                  <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-slate-900" />
                  <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-slate-900" />
                  <span className="relative z-10">Upgrade to Create Events</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


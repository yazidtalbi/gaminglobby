'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameSearch } from '@/components/GameSearch'
import { CandidateCard } from '@/components/CandidateCard'
import { CountdownTimer } from '@/components/CountdownTimer'
import { GameSelectionCard } from '@/components/GameSelectionCard'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { createClient } from '@/lib/supabase/client'
import { WeeklyRound, WeeklyGameCandidate } from '@/types/database'
import Refresh from '@mui/icons-material/Refresh'
import Add from '@mui/icons-material/Add'
import CheckCircle from '@mui/icons-material/CheckCircle'
import PlayArrow from '@mui/icons-material/PlayArrow'
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
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})
  const [isFounder, setIsFounder] = useState(false)
  const [isEndingVote, setIsEndingVote] = useState(false)
  const [isStartingVote, setIsStartingVote] = useState(false)
  const [selectionPhase, setSelectionPhase] = useState<{
    round: any
    selections: any[]
    userVotes: Record<string, { day_pref: string; time_pref: string }>
    deadlinePassed: boolean
    error?: string
    warning?: string
  } | null>(null)
  const [isProcessingSelections, setIsProcessingSelections] = useState(false)

  const fetchRoundData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Check if user is founder (needed for both voting and selection phases)
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan_tier')
          .eq('id', user.id)
          .single()
        
        if (!profileError && profile) {
          setIsFounder(profile.plan_tier === 'founder')
        } else {
          setIsFounder(false)
        }
      } else {
        setIsFounder(false)
      }

      // Check for selection phase first
      const selectionResponse = await fetch('/api/events/selections/current')
      const selectionData = await selectionResponse.json()

      // Debug logging
      if (selectionData.round) {
        console.log('Selection phase detected:', {
          roundId: selectionData.round.id,
          status: selectionData.round.status,
          selectionPhaseCompleted: selectionData.round.selection_phase_completed,
          selectionsCount: selectionData.selections?.length || 0,
          error: selectionData.error,
          warning: selectionData.warning,
        })
      }

      if (selectionData.round && !selectionData.round.selection_phase_completed) {
        // Show selection phase UI even if selections are missing (so we can show error/help)
        setSelectionPhase(selectionData)
        setRound(null) // Clear voting round
        setIsLoading(false)
        return
      }
      setSelectionPhase(null)

      const response = await fetch('/api/events/rounds/current')
      const data = await response.json()

      if (data.round) {
        setRound(data.round)
        setUserVotes(
          (data.userVotes || []).reduce(
            (acc: Record<string, boolean>, vote: any) => {
              acc[vote.candidate_id] = true
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

      // Fetch square cover images for candidates (like sidebar)
      const coverPromises = (candidatesData.candidates || []).map(async (candidate: WeeklyGameCandidate) => {
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

    } catch (error) {
      console.error('Error fetching round data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchRoundData()
  }, [fetchRoundData])

  useEffect(() => {
    if (!round && !selectionPhase?.round) return

    // Subscribe to realtime updates for voting phase
    if (round) {
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
    }

    // Subscribe to realtime updates for selection phase
    if (selectionPhase?.round) {
      const selectionIds = selectionPhase.selections.map(s => s.id)
      const selectionsChannel = supabase
        .channel(`weekly_selections_${selectionPhase.round.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'weekly_game_selection_votes',
          },
          (payload: any) => {
            // Only refresh if the change is for one of our selections
            if (selectionIds.includes(payload.new?.selection_id) || selectionIds.includes(payload.old?.selection_id)) {
              fetchRoundData()
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(selectionsChannel)
      }
    }
  }, [round?.id, selectionPhase?.round?.id, supabase])

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

  const handleEndVote = async () => {
    if (!confirm('Are you sure you want to end the current weekly vote? This will lock the round and prevent further voting.')) {
      return
    }

    setIsEndingVote(true)
    try {
      const response = await fetch('/api/events/rounds/end', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Vote ended successfully:', data)
        // Wait a moment for the database to update, then refresh
        setTimeout(() => {
          fetchRoundData()
        }, 500)
        alert(`Vote ended successfully! ${data.selectionsCreated || 0} selection(s) created. Users can now select day and time for the top games.`)
      } else {
        console.error('Failed to end vote:', data)
        alert(data.error || 'Failed to end weekly vote')
        if (data.details) {
          console.error('Error details:', data.details)
          alert(`Error details: ${data.details}`)
        }
        if (data.code) {
          console.error('Error code:', data.code)
        }
      }
    } catch (error) {
      console.error('Error ending vote:', error)
      alert('Failed to end weekly vote. Please try again.')
    } finally {
      setIsEndingVote(false)
    }
  }

  const handleStartVote = async () => {
    if (!confirm('Are you sure you want to start a new weekly vote? This will create a new voting round.')) {
      return
    }

    setIsStartingVote(true)
    try {
      const response = await fetch('/api/events/rounds/start', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'New weekly vote started successfully')
        fetchRoundData()
      } else {
        alert(data.error || 'Failed to start weekly vote')
      }
    } catch (error) {
      console.error('Error starting vote:', error)
      alert('Failed to start weekly vote. Please try again.')
    } finally {
      setIsStartingVote(false)
    }
  }

  const handleCreateSelections = async () => {
    if (!confirm('Create selection cards for the top 3 games from the locked round?')) {
      return
    }

    try {
      const response = await fetch('/api/events/selections/create', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert('Selection cards created successfully!')
        fetchRoundData()
      } else {
        console.error('Error creating selections:', data.error || 'Unknown error')
        alert(data.error || 'Failed to create selections')
      }
    } catch (error) {
      console.error('Error creating selections:', error)
      alert('Failed to create selections. Please try again.')
    }
  }

  const handleProcessSelections = async () => {
    if (!confirm('Process selections and create events? This will create events for all games with the most popular day and time, and start a new weekly vote.')) {
      return
    }

    setIsProcessingSelections(true)
    try {
      const response = await fetch('/api/events/selections/process', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert('Selections processed successfully! Events have been created and a new weekly vote has started.')
        fetchRoundData()
      } else {
        console.error('Error processing selections:', data.error || 'Unknown error')
        alert(data.error || 'Failed to process selections')
      }
    } catch (error) {
      console.error('Error processing selections:', error)
      alert('Failed to process selections. Please try again.')
    } finally {
      setIsProcessingSelections(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Refresh className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  // Show selection phase if active - use same layout as voting page but hide game input
  if (selectionPhase && selectionPhase.round) {
    const deadline = new Date(selectionPhase.round.selection_phase_deadline)
    const deadlinePassed = selectionPhase.deadlinePassed
    const weekLabel = selectionPhase.round.week_key

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

                  {!deadlinePassed ? (
                    <CountdownTimer targetDate={deadline.toISOString()} />
                  ) : (
                    <p className="text-slate-500">Selection deadline has passed.</p>
                  )}

                  {/* Founder Actions */}
                  {isFounder && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
                      {deadlinePassed ? (
                        <button
                          onClick={handleProcessSelections}
                          disabled={isProcessingSelections}
                          className="w-full px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessingSelections ? (
                            <>
                              <Refresh className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Process Selections & Create Events
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="text-xs text-slate-500 text-center">
                          Users are selecting day and time for the top 3 games.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Selection Cards (Game input is hidden) */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-title text-white mb-2">Select Day & Time</h2>
                <p className="text-slate-400">
                  The weekly vote has ended. Choose your preferred day and time for each of the top 3 games.
                </p>
              </div>

              {selectionPhase.selections && selectionPhase.selections.length > 0 ? (
                <div className="space-y-6">
                  {selectionPhase.selections.map((selection) => (
                    <GameSelectionCard
                      key={selection.id}
                      selection={selection}
                      userVote={selectionPhase.userVotes[selection.id] || null}
                      onVoteUpdate={fetchRoundData}
                      isFounder={isFounder}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-title text-white mb-2">No Selection Cards Available</h3>
                    <p className="text-slate-400 mb-4">
                      {selectionPhase.error || selectionPhase.warning || 'The selection phase is active, but no games are available for selection.'}
                    </p>
                  </div>

                  {selectionPhase.error?.includes('migration') || selectionPhase.error?.includes('table') ? (
                    <div className="space-y-4 bg-slate-900/50 border border-red-500/50 p-6 rounded">
                      <div className="flex items-start gap-3">
                        <div className="text-red-400 font-bold text-lg">⚠️</div>
                        <div className="flex-1">
                          <p className="text-red-400 font-title mb-2">Database Migration Required</p>
                          <p className="text-sm text-slate-300 mb-4">
                            The database tables for the selection phase haven't been created yet. You need to run the migration first.
                          </p>
                          <div className="bg-slate-800 p-4 rounded border border-slate-700">
                            <p className="text-xs text-slate-400 mb-2">Run this SQL in your Supabase SQL Editor:</p>
                            <code className="text-cyan-400 text-xs block break-all">
                              supabase/migrations/013_add_game_selection_phase.sql
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 text-center">
                        The selections may not have been created when the vote ended.
                      </p>
                      {isFounder && (
                        <div className="text-center">
                          <button
                            onClick={handleCreateSelections}
                            className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors"
                          >
                            Create Selections Now
                          </button>
                          <p className="text-xs text-slate-500 mt-2">
                            This will create selection cards for the top 3 games from the locked round.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
            <h1 className="text-2xl font-title text-white mb-4">No Voting Round Active</h1>
            <p className="text-slate-400 mb-6">
              There's no active weekly voting round right now. Check back soon!
            </p>
            {/* Founder Actions - Show start button when no round exists */}
            {isFounder && (
              <button
                onClick={handleStartVote}
                disabled={isStartingVote}
                className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {isStartingVote ? (
                  <>
                    <Refresh className="w-4 h-4 animate-spin" />
                    Starting Vote...
                  </>
                ) : (
                  <>
                    <PlayArrow className="w-4 h-4" />
                    Start New Weekly Vote
                  </>
                )}
              </button>
            )}
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

                {/* Founder Actions */}
                {isFounder && (
                  <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
                    {isVotingOpen ? (
                      <button
                        onClick={handleEndVote}
                        disabled={isEndingVote}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-title text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isEndingVote ? (
                          <>
                            <Refresh className="w-4 h-4 animate-spin" />
                            Ending Vote...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            End Weekly Vote
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartVote}
                        disabled={isStartingVote}
                        className="w-full px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isStartingVote ? (
                          <>
                            <Refresh className="w-4 h-4 animate-spin" />
                            Starting Vote...
                          </>
                        ) : (
                          <>
                            <PlayArrow className="w-4 h-4" />
                            Start New Weekly Vote
                          </>
                        )}
                      </button>
                    )}
                  </div>
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


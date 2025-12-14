'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TournamentWithHost, TournamentParticipant, TournamentMatch } from '@/types/tournaments'
import { getTournamentState, TournamentState } from '@/lib/tournaments/state'
import { TournamentHero } from '@/components/tournaments/TournamentHero'
import { FinalResultsPodium } from '@/components/tournaments/FinalResultsPodium'
import { TournamentBracketAccordion } from '@/components/tournaments/TournamentBracketAccordion'
import { RewardsStrip } from '@/components/tournaments/RewardsStrip'
import { RankedParticipants } from '@/components/tournaments/RankedParticipants'
import { AboutAndRulesAccordions } from '@/components/tournaments/AboutAndRulesAccordions'
import { StartTournamentButton } from '@/components/tournaments/StartTournamentButton'
import { Loader2 } from 'lucide-react'

export default function TournamentDetailPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const { user } = useAuth()
  
  const [tournament, setTournament] = useState<TournamentWithHost | null>(null)
  const [participants, setParticipants] = useState<TournamentParticipant[]>([])
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userParticipation, setUserParticipation] = useState<{
    is_registered: boolean
    is_checked_in: boolean
    status: string | null
  } | null>(null)

  useEffect(() => {
    if (tournamentId) {
      fetchTournament()
    }
  }, [tournamentId])

  const fetchTournament = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      const data = await response.json()

      if (response.ok) {
        setTournament(data.tournament)
        setParticipants(data.participants || [])
        setMatches(data.matches || [])
        setUserParticipation(data.user_participation)
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Tournament not found</p>
      </div>
    )
  }

  const tournamentState = getTournamentState(tournament)
  const checkedInCount = participants.filter(p => p.status === 'checked_in').length
  const hasResults = participants.some(p => p.final_placement !== null)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Hero (Winner + Status + Meta) */}
        <TournamentHero
          tournament={tournament}
          tournamentState={tournamentState}
          participants={participants}
          matches={matches}
          userParticipation={userParticipation}
          onUpdate={fetchTournament}
          user={user}
        />

        {/* Host Actions - Start Tournament Button */}
        {user && tournament.host_id === user.id && matches.length === 0 && (
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4 rounded-lg">
            <h2 className="text-lg font-title text-white mb-4">Host Actions</h2>
            {tournament.status === 'in_progress' && (
              <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded">
                <p className="font-semibold mb-2">Tournament is in progress but no matches found.</p>
                <p className="text-sm">The bracket may not have been generated. Click below to generate matches.</p>
              </div>
            )}
            <StartTournamentButton tournament={tournament} onSuccess={fetchTournament} />
          </div>
        )}

        {/* Info Messages */}
        {user && tournament.host_id !== user.id && matches.length === 0 && tournament.status === 'in_progress' && (
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4 rounded-lg">
            <p className="text-slate-400">
              The tournament has started, but matches are not yet available. Please wait for the host to generate the bracket.
            </p>
          </div>
        )}

        {matches.length === 0 && tournament.status !== 'in_progress' && checkedInCount < tournament.max_participants && (
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4 rounded-lg">
            <p className="text-slate-400">
              Waiting for {tournament.max_participants - checkedInCount} more participant{tournament.max_participants - checkedInCount > 1 ? 's' : ''} to check in before the tournament can start.
              Currently: {checkedInCount}/{tournament.max_participants} checked in.
            </p>
          </div>
        )}

        {/* 2. Final Results (Podium) - Only show if completed or live with results */}
        {(tournamentState === 'completed' || (tournamentState === 'live' && hasResults)) && (
          <div className="mb-6">
            <FinalResultsPodium participants={participants} />
          </div>
        )}

        {/* 3. Bracket */}
        {matches.length > 0 && (
          <div className="mb-6">
            <TournamentBracketAccordion
              matches={matches}
              tournament={tournament}
              tournamentId={tournamentId}
              onUpdate={fetchTournament}
            />
          </div>
        )}

        {/* 4. Participants (Ranked List) */}
        <div className="mb-6">
          <RankedParticipants participants={participants} tournamentState={tournamentState} />
        </div>

        {/* 6. About + Rules (Collapsible) */}
        <div className="mb-6">
          <AboutAndRulesAccordions tournament={tournament} tournamentState={tournamentState} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TournamentWithHost, TournamentMatch, TournamentParticipant } from '@/types/tournaments'
import { TournamentMatchCard } from '@/components/tournaments/TournamentMatchCard'
import { MatchReportModal } from '@/components/tournaments/MatchReportModal'
import { HostFinalizeModal } from '@/components/tournaments/HostFinalizeModal'
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function TournamentMatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  const matchId = params.matchId as string
  const { user } = useAuth()

  const [tournament, setTournament] = useState<TournamentWithHost | null>(null)
  const [match, setMatch] = useState<TournamentMatch | null>(null)
  const [participants, setParticipants] = useState<TournamentParticipant[]>([])
  const [userParticipant, setUserParticipant] = useState<TournamentParticipant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)

  useEffect(() => {
    if (tournamentId && matchId) {
      fetchData()
    }
  }, [tournamentId, matchId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      const data = await response.json()

      if (response.ok) {
        setTournament(data.tournament)
        setParticipants(data.participants || [])
        const matches = data.matches || []
        const foundMatch = matches.find((m: TournamentMatch) => m.id === matchId)
        setMatch(foundMatch || null)

        if (user && data.participants) {
          const participant = data.participants.find(
            (p: TournamentParticipant) => p.user_id === user.id
          )
          setUserParticipant(participant || null)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

  if (!tournament || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Match not found</p>
      </div>
    )
  }

  const isUserInMatch = userParticipant && (
    userParticipant.id === match.participant1_id || userParticipant.id === match.participant2_id
  )
  const isHost = user && tournament.host_id === user.id
  const canSubmitReport = isUserInMatch && (match.status === 'pending' || match.status === 'in_progress')
  const canFinalize = isHost && match.status === 'in_progress'

  const getParticipantName = (participantId: string | null) => {
    if (!participantId) return 'TBD'
    if (participantId === match.participant1_id) {
      return match.participant1?.profile?.display_name || match.participant1?.profile?.username || 'Participant 1'
    }
    if (participantId === match.participant2_id) {
      return match.participant2?.profile?.display_name || match.participant2?.profile?.username || 'Participant 2'
    }
    return 'Unknown'
  }

  const statusColors = {
    pending: 'bg-slate-600',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    forfeited: 'bg-red-500',
  }

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'Live',
    completed: 'Completed',
    forfeited: 'Forfeited',
  }

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/tournaments/${tournamentId}/matches`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Matches</span>
            </Link>

            <div className="mb-4">
              <h1 className="text-3xl font-title text-white mb-2">
                Match {match.match_number}
              </h1>
              <p className="text-slate-400">Round {match.round_number}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link
                href={`/tournaments/${tournamentId}`}
                className="hover:text-cyan-400"
              >
                {tournament.title}
              </Link>
              <span>•</span>
              <span>{tournament.game_name}</span>
            </div>
          </div>

          {/* Match Card */}
          <div className="mb-8">
            <TournamentMatchCard
              match={match}
              tournament={tournament}
              onUpdate={fetchData}
            />
          </div>

          {/* Match Details */}
          <div className="border border-slate-700/50 bg-slate-800/30 p-6 mb-8">
            <h2 className="text-xl font-title text-white mb-4">Match Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Participant 1 */}
                <div className="border border-slate-700/50 bg-slate-800/30 p-4">
                  <h3 className="text-sm font-title uppercase text-slate-400 mb-3">Participant 1</h3>
                  <div className="flex items-center gap-3">
                    {match.participant1?.profile?.avatar_url ? (
                      <img
                        src={match.participant1.profile.avatar_url}
                        alt={getParticipantName(match.participant1_id)}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center">
                        <span className="text-white font-bold">?</span>
                      </div>
                    )}
                    <div>
                      <p className={`text-lg font-bold ${match.winner_id === match.participant1_id ? 'text-cyan-400' : 'text-white'}`}>
                        {getParticipantName(match.participant1_id)}
                      </p>
                      {match.status === 'completed' && (
                        <p className="text-sm text-slate-400">Score: {match.score1}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Participant 2 */}
                <div className="border border-slate-700/50 bg-slate-800/30 p-4">
                  <h3 className="text-sm font-title uppercase text-slate-400 mb-3">Participant 2</h3>
                  <div className="flex items-center gap-3">
                    {match.participant2?.profile?.avatar_url ? (
                      <img
                        src={match.participant2.profile.avatar_url}
                        alt={getParticipantName(match.participant2_id)}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center">
                        <span className="text-white font-bold">?</span>
                      </div>
                    )}
                    <div>
                      <p className={`text-lg font-bold ${match.winner_id === match.participant2_id ? 'text-cyan-400' : 'text-white'}`}>
                        {getParticipantName(match.participant2_id)}
                      </p>
                      {match.status === 'completed' && (
                        <p className="text-sm text-slate-400">Score: {match.score2}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Info */}
              <div className="border-t border-slate-700/50 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Round:</span>
                    <span className="text-white ml-2">Round {match.round_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Match Number:</span>
                    <span className="text-white ml-2">{match.match_number}</span>
                  </div>
                  {match.lobby_id && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Lobby:</span>
                      <Link
                        href={`/lobbies/${match.lobby_id}`}
                        className="text-cyan-400 hover:text-cyan-300 ml-2 inline-flex items-center gap-1"
                      >
                        <span>View Lobby</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {user && (
            <div className="flex gap-3">
              {canSubmitReport && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-slate-900 px-6 py-3 font-title uppercase"
                >
                  Submit Match Report
                </button>
              )}
              {canFinalize && (
                <button
                  onClick={() => setShowFinalizeModal(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 font-title uppercase"
                >
                  Finalize Match
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showReportModal && userParticipant && (
        <MatchReportModal
          match={match}
          tournamentId={tournament.id}
          participant={userParticipant}
          participant1={match.participant1 || null}
          participant2={match.participant2 || null}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            fetchData()
            setShowReportModal(false)
          }}
        />
      )}

      {showFinalizeModal && (
        <HostFinalizeModal
          match={match}
          tournamentId={tournament.id}
          onClose={() => setShowFinalizeModal(false)}
          onSuccess={() => {
            fetchData()
            setShowFinalizeModal(false)
          }}
        />
      )}
    </>
  )
}

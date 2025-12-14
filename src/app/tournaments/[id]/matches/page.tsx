'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TournamentWithHost, TournamentMatch } from '@/types/tournaments'
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function TournamentMatchesPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  const { user } = useAuth()

  const [tournament, setTournament] = useState<TournamentWithHost | null>(null)
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        setMatches(data.matches || [])
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

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_number]) {
      acc[match.round_number] = []
    }
    acc[match.round_number].push(match)
    return acc
  }, {} as Record<number, TournamentMatch[]>)

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)

  const getParticipantName = (match: TournamentMatch, participantId: string | null) => {
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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tournament</span>
          </Link>

          <h1 className="text-3xl font-title text-white mb-2">Matches</h1>
          <p className="text-slate-400">{tournament.title}</p>
        </div>

        {/* Matches List */}
        {rounds.length > 0 ? (
          <div className="space-y-8">
            {rounds.map((roundNumber) => (
              <div key={roundNumber}>
                <h2 className="text-xl font-title text-cyan-400 mb-4 uppercase">
                  Round {roundNumber}
                </h2>
                <div className="border border-slate-700/50 bg-slate-800/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-title uppercase text-slate-400">Match</th>
                          <th className="px-4 py-3 text-left text-xs font-title uppercase text-slate-400">Participants</th>
                          <th className="px-4 py-3 text-left text-xs font-title uppercase text-slate-400">Score</th>
                          <th className="px-4 py-3 text-left text-xs font-title uppercase text-slate-400">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-title uppercase text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {matchesByRound[roundNumber].map((match) => (
                          <tr
                            key={match.id}
                            className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/tournaments/${tournamentId}/matches/${match.id}`)}
                          >
                            <td className="px-4 py-4">
                              <span className="text-white font-title">Match {match.match_number}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {match.participant1?.profile?.avatar_url ? (
                                    <img
                                      src={match.participant1.profile.avatar_url}
                                      alt={getParticipantName(match, match.participant1_id)}
                                      className="w-6 h-6 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-700" />
                                  )}
                                  <span className={`text-sm ${match.winner_id === match.participant1_id ? 'text-cyan-400 font-bold' : 'text-white'}`}>
                                    {getParticipantName(match, match.participant1_id)}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 pl-8">VS</div>
                                <div className="flex items-center gap-2">
                                  {match.participant2?.profile?.avatar_url ? (
                                    <img
                                      src={match.participant2.profile.avatar_url}
                                      alt={getParticipantName(match, match.participant2_id)}
                                      className="w-6 h-6 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-700" />
                                  )}
                                  <span className={`text-sm ${match.winner_id === match.participant2_id ? 'text-cyan-400 font-bold' : 'text-white'}`}>
                                    {getParticipantName(match, match.participant2_id)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {match.status === 'completed' ? (
                                <span className="text-white font-bold">
                                  {match.score1} - {match.score2}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs font-title uppercase text-white ${statusColors[match.status]}`}>
                                {statusLabels[match.status]}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/tournaments/${tournamentId}/matches/${match.id}`)
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                {match.lobby_id && (
                                  <Link
                                    href={`/lobbies/${match.lobby_id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-slate-400 hover:text-slate-300 text-sm"
                                  >
                                    Lobby
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-700/50 bg-slate-800/30 p-8 text-center">
            <p className="text-slate-400">No matches yet. Tournament bracket will be generated when the tournament starts.</p>
          </div>
        )}
      </div>
    </div>
  )
}

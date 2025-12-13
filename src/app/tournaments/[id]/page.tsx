'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TournamentWithHost, TournamentParticipant, TournamentMatch } from '@/types/tournaments'
import { TournamentRegistrationPanel } from '@/components/tournaments/TournamentRegistrationPanel'
import { TournamentMatchCard } from '@/components/tournaments/TournamentMatchCard'
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {tournament.cover_url && (
            <div className="w-full h-48 mb-6 overflow-hidden">
              <img
                src={tournament.cover_url}
                alt={tournament.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-3xl font-title text-white mb-2">{tournament.title}</h1>
          <p className="text-slate-400 mb-4">{tournament.game_name}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span>Status: <span className="text-white">{tournament.status}</span></span>
            <span>Participants: <span className="text-white">{tournament.current_participants}/{tournament.max_participants}</span></span>
            <span>Platform: <span className="text-white uppercase">{tournament.platform}</span></span>
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="mb-8">
            <h2 className="text-xl font-title text-white mb-2">Description</h2>
            <p className="text-slate-300">{tournament.description}</p>
          </div>
        )}

        {/* Prize Badges */}
        {(tournament.badge_1st_label || tournament.badge_2nd_label || tournament.badge_3rd_label) && (
          <div className="mb-8">
            <h2 className="text-xl font-title text-white mb-4">Prize Badges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {tournament.badge_1st_label && (
                <div className="border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 border border-slate-700 bg-slate-800 flex items-center justify-center">
                      {tournament.badge_1st_image_url ? (
                        <img
                          src={tournament.badge_1st_image_url}
                          alt={tournament.badge_1st_label}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-4xl">🥇</span>
                      )}
                    </div>
                    <h3 className="text-sm font-title uppercase text-cyan-400 mb-1">1st Place</h3>
                    <p className="text-white font-semibold">{tournament.badge_1st_label}</p>
                  </div>
                </div>
              )}

              {tournament.badge_2nd_label && (
                <div className="border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 border border-slate-700 bg-slate-800 flex items-center justify-center">
                      {tournament.badge_2nd_image_url ? (
                        <img
                          src={tournament.badge_2nd_image_url}
                          alt={tournament.badge_2nd_label}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-4xl">🥈</span>
                      )}
                    </div>
                    <h3 className="text-sm font-title uppercase text-cyan-400 mb-1">2nd Place</h3>
                    <p className="text-white font-semibold">{tournament.badge_2nd_label}</p>
                  </div>
                </div>
              )}

              {tournament.badge_3rd_label && (
                <div className="border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-3 border border-slate-700 bg-slate-800 flex items-center justify-center">
                      {tournament.badge_3rd_image_url ? (
                        <img
                          src={tournament.badge_3rd_image_url}
                          alt={tournament.badge_3rd_label}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-4xl">🥉</span>
                      )}
                    </div>
                    <h3 className="text-sm font-title uppercase text-cyan-400 mb-1">3rd Place</h3>
                    <p className="text-white font-semibold">{tournament.badge_3rd_label}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration Panel */}
        {user && (
          <TournamentRegistrationPanel
            tournament={tournament}
            userParticipation={userParticipation}
            onUpdate={fetchTournament}
          />
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-title text-white mb-4">Participants ({participants.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="text-center">
                  {participant.profile?.avatar_url ? (
                    <img
                      src={participant.profile.avatar_url}
                      alt={participant.profile.username}
                      className="w-16 h-16 rounded-full mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold">?</span>
                    </div>
                  )}
                  <p className="text-sm text-white truncate">
                    {participant.profile?.display_name || participant.profile?.username}
                  </p>
                  <p className="text-xs text-slate-400 uppercase">{participant.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches by Round */}
        {rounds.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-title text-white mb-4">Bracket</h2>
            {rounds.map((roundNumber) => (
              <div key={roundNumber} className="mb-6">
                <h3 className="text-lg font-title text-cyan-400 mb-3 uppercase">
                  Round {roundNumber}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                  {matchesByRound[roundNumber].map((match) => (
                    <TournamentMatchCard
                      key={match.id}
                      match={match}
                      tournament={tournament}
                      onUpdate={fetchTournament}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rules */}
        {tournament.rules && (
          <div className="mb-8">
            <h2 className="text-xl font-title text-white mb-2">Rules</h2>
            <div className="bg-slate-800/30 border border-slate-700/50 p-4">
              <p className="text-slate-300 whitespace-pre-line">{tournament.rules}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

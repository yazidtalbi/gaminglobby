'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { TournamentWithHost, TournamentParticipant, TournamentMatch } from '@/types/tournaments'
import { TournamentRegistrationPanel } from '@/components/tournaments/TournamentRegistrationPanel'
import { TournamentMatchCard } from '@/components/tournaments/TournamentMatchCard'
import { StartTournamentButton } from '@/components/tournaments/StartTournamentButton'
import { Loader2, Calendar, Clock, UserCheck, Trophy, Award, Medal } from 'lucide-react'

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

  // Get checked-in participants count
  const checkedInCount = participants.filter(p => p.status === 'checked_in').length

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

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
            <span>Status: <span className="text-white">{tournament.status}</span></span>
            <span>Participants: <span className="text-white">{tournament.current_participants}/{tournament.max_participants}</span></span>
            <span>Platform: <span className="text-white uppercase">{tournament.platform}</span></span>
          </div>

          {/* Tournament Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="border border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-title uppercase text-slate-400">Start Date</span>
              </div>
              <p className="text-white font-semibold">
                {new Date(tournament.start_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-slate-400">
                {new Date(tournament.start_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="border border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-title uppercase text-slate-400">Registration Deadline</span>
              </div>
              <p className="text-white font-semibold">
                {new Date(tournament.registration_deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-slate-400">
                {new Date(tournament.registration_deadline).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {new Date(tournament.registration_deadline) < new Date() && (
                <p className="text-xs text-red-400 mt-1">Closed</p>
              )}
            </div>

            {tournament.check_in_required && (
              <div className="border border-slate-700/50 bg-slate-800/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-title uppercase text-slate-400">Check-in Deadline</span>
                </div>
                <p className="text-white font-semibold">
                  {new Date(tournament.check_in_deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-slate-400">
                  {new Date(tournament.check_in_deadline).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {new Date(tournament.check_in_deadline) < new Date() && (
                  <p className="text-xs text-red-400 mt-1">Closed</p>
                )}
              </div>
            )}
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

        {/* Start Tournament Button (Host Only) */}
        {user && tournament.host_id === user.id && matches.length === 0 && (
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4">
            <h2 className="text-lg font-title text-white mb-4">Host Actions</h2>
            {tournament.status === 'in_progress' ? (
              <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400">
                <p className="font-semibold mb-2">Tournament is in progress but no matches found.</p>
                <p className="text-sm">The bracket may not have been generated. Click below to generate matches.</p>
              </div>
            ) : null}
            <StartTournamentButton
              tournament={tournament}
              onSuccess={fetchTournament}
            />
          </div>
        )}

        {/* Info Message for Non-Hosts */}
        {user && tournament.host_id !== user.id && matches.length === 0 && tournament.status === 'in_progress' && (
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4">
            <p className="text-slate-400">
              The tournament has started, but matches are not yet available. Please wait for the host to generate the bracket.
            </p>
          </div>
        )}

        {/* Info Message when tournament needs more participants */}
        {matches.length === 0 && tournament.status !== 'in_progress' && checkedInCount < tournament.max_participants && (
          <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4">
            <p className="text-slate-400">
              Waiting for {tournament.max_participants - checkedInCount} more participant{tournament.max_participants - checkedInCount > 1 ? 's' : ''} to check in before the tournament can start.
              Currently: {checkedInCount}/{tournament.max_participants} checked in.
            </p>
          </div>
        )}

        {/* Tournament Results (if completed) */}
        {tournament.status === 'completed' && (
          <div className="mb-8">
            <h2 className="text-2xl font-title text-white mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Final Results
            </h2>
            
            {/* Podium/Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 2nd Place */}
              {participants.find(p => p.final_placement === 2) && (
                <div className="order-2 md:order-1 border border-slate-700/50 bg-slate-800/30 p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Medal className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-title uppercase text-slate-400">2nd Place</span>
                  </div>
                  {participants.find(p => p.final_placement === 2)?.profile?.avatar_url ? (
                    <img
                      src={participants.find(p => p.final_placement === 2)!.profile!.avatar_url!}
                      alt={participants.find(p => p.final_placement === 2)!.profile!.username || ''}
                      className="w-20 h-20 rounded-full mx-auto mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">?</span>
                    </div>
                  )}
                  <p className="text-lg font-bold text-slate-300">
                    {participants.find(p => p.final_placement === 2)?.profile?.display_name || 
                     participants.find(p => p.final_placement === 2)?.profile?.username || 
                     'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Finalist</p>
                </div>
              )}

              {/* 1st Place (Winner) */}
              {participants.find(p => p.final_placement === 1) && (
                <div className="order-1 md:order-2 border-2 border-yellow-400/50 bg-yellow-400/10 p-6 text-center relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-3 mt-2">
                    <span className="text-sm font-title uppercase text-yellow-400">Champion</span>
                  </div>
                  {participants.find(p => p.final_placement === 1)?.profile?.avatar_url ? (
                    <img
                      src={participants.find(p => p.final_placement === 1)!.profile!.avatar_url!}
                      alt={participants.find(p => p.final_placement === 1)!.profile!.username || ''}
                      className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-yellow-400"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-3 flex items-center justify-center border-2 border-yellow-400">
                      <span className="text-white font-bold text-xl">?</span>
                    </div>
                  )}
                  <p className="text-xl font-bold text-yellow-400">
                    {participants.find(p => p.final_placement === 1)?.profile?.display_name || 
                     participants.find(p => p.final_placement === 1)?.profile?.username || 
                     'Unknown'}
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">Tournament Winner</p>
                </div>
              )}

              {/* 3rd Place */}
              {participants.find(p => p.final_placement === 3) && (
                <div className="order-3 border border-slate-700/50 bg-slate-800/30 p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-title uppercase text-slate-400">3rd Place</span>
                  </div>
                  {participants.find(p => p.final_placement === 3)?.profile?.avatar_url ? (
                    <img
                      src={participants.find(p => p.final_placement === 3)!.profile!.avatar_url!}
                      alt={participants.find(p => p.final_placement === 3)!.profile!.username || ''}
                      className="w-20 h-20 rounded-full mx-auto mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold">?</span>
                    </div>
                  )}
                  <p className="text-lg font-bold text-slate-300">
                    {participants.find(p => p.final_placement === 3)?.profile?.display_name || 
                     participants.find(p => p.final_placement === 3)?.profile?.username || 
                     'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Top 3</p>
                </div>
              )}
            </div>

            {/* Full Standings */}
            <div className="border border-slate-700/50 bg-slate-800/30 p-4">
              <h3 className="text-lg font-title text-white mb-4">Final Standings</h3>
              <div className="space-y-2">
                {participants
                  .filter(p => p.final_placement !== null)
                  .sort((a, b) => (a.final_placement || 999) - (b.final_placement || 999))
                  .map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/50 rounded"
                    >
                      <div className="w-8 text-center">
                        {participant.final_placement === 1 && <span className="text-yellow-400 font-bold">🥇</span>}
                        {participant.final_placement === 2 && <span className="text-slate-400 font-bold">🥈</span>}
                        {participant.final_placement === 3 && <span className="text-amber-600 font-bold">🥉</span>}
                        {participant.final_placement && participant.final_placement > 3 && (
                          <span className="text-slate-500 font-bold">#{participant.final_placement}</span>
                        )}
                      </div>
                      {participant.profile?.avatar_url ? (
                        <img
                          src={participant.profile.avatar_url}
                          alt={participant.profile.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center">
                          <span className="text-white font-bold text-sm">?</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {participant.profile?.display_name || participant.profile?.username || 'Unknown'}
                        </p>
                        {participant.final_placement === 1 && (
                          <p className="text-xs text-yellow-400">Tournament Winner</p>
                        )}
                        {participant.final_placement === 2 && (
                          <p className="text-xs text-slate-400">Finalist</p>
                        )}
                        {participant.final_placement === 3 && (
                          <p className="text-xs text-amber-600">Top 3</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
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
        {rounds.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-title text-white">Bracket</h2>
              <Link
                href={`/tournaments/${tournamentId}/matches`}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-title uppercase"
              >
                View All Matches →
              </Link>
            </div>
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
        ) : tournament.status === 'in_progress' ? (
          <div className="mb-8 border border-slate-700/50 bg-slate-800/30 p-8 text-center">
            <p className="text-slate-400">No matches found. The bracket may not have been generated yet.</p>
          </div>
        ) : null}

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

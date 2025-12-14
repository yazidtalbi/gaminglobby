'use client'

import { TournamentMatch, TournamentWithHost } from '@/types/tournaments'
import Link from 'next/link'

interface TournamentBracketProps {
  matches: TournamentMatch[]
  tournament: TournamentWithHost
  onUpdate?: () => void
}

export function TournamentBracket({ matches, tournament, onUpdate }: TournamentBracketProps) {
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
    return 'TBD'
  }

  const getParticipantAvatar = (match: TournamentMatch, participantId: string | null) => {
    if (!participantId) return null
    if (participantId === match.participant1_id) {
      return match.participant1?.profile?.avatar_url
    }
    if (participantId === match.participant2_id) {
      return match.participant2?.profile?.avatar_url
    }
    return null
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

  if (rounds.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-16 min-w-full py-8 px-8">
        {rounds.map((roundNumber, roundIndex) => {
          const roundMatches = matchesByRound[roundNumber].sort((a, b) => a.match_number - b.match_number)
          const isLastRound = roundIndex === rounds.length - 1
          
          return (
            <div key={roundNumber} className="flex flex-col justify-center gap-8 min-w-[280px] relative">
              {/* Round Header */}
              <div className="text-center mb-2">
                <h3 className="text-lg font-title text-cyan-400 uppercase">
                  {isLastRound ? 'Final' : `Round ${roundNumber}`}
                </h3>
              </div>

              {/* Matches */}
              <div className="flex flex-col gap-8 relative">
                {roundMatches.map((match, matchIndex) => {
                  const p1Name = getParticipantName(match, match.participant1_id)
                  const p2Name = getParticipantName(match, match.participant2_id)
                  const p1Avatar = getParticipantAvatar(match, match.participant1_id)
                  const p2Avatar = getParticipantAvatar(match, match.participant2_id)
                  const isP1Winner = match.winner_id === match.participant1_id
                  const isP2Winner = match.winner_id === match.participant2_id

                  return (
                    <div key={match.id} className="relative">
                      {/* Connecting lines to next round */}
                      {!isLastRound && (
                        <div 
                          className="absolute left-full top-1/2 w-16 h-[2px] bg-cyan-400/60 z-0"
                          style={{ 
                            transform: 'translateY(-50%)',
                            marginTop: '-1px',
                          }}
                        />
                      )}

                      {/* Match Card */}
                      <Link
                        href={`/tournaments/${tournament.id}/matches/${match.id}`}
                        className="relative block border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 hover:border-cyan-400/30 transition-all p-4 z-10 rounded"
                      >
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 text-xs font-title uppercase text-white ${statusColors[match.status]}`}>
                            {statusLabels[match.status]}
                          </span>
                        </div>

                        {/* Participant 1 */}
                        <div className={`flex items-center gap-2.5 mb-2 ${isP1Winner ? 'text-cyan-400' : 'text-white'}`}>
                          {p1Avatar ? (
                            <img
                              src={p1Avatar}
                              alt={p1Name}
                              className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center flex-shrink-0 border-2 border-slate-700">
                              <span className="text-white text-xs font-bold">?</span>
                            </div>
                          )}
                          <span className={`flex-1 truncate text-sm ${isP1Winner ? 'font-bold' : ''}`}>{p1Name}</span>
                          {match.status === 'completed' && (
                            <span className={`text-sm font-bold ${isP1Winner ? 'text-cyan-400' : 'text-slate-300'}`}>
                              {match.score1}
                            </span>
                          )}
                        </div>

                        {/* VS Separator */}
                        <div className="text-center text-xs text-slate-500 my-1.5 font-title">VS</div>

                        {/* Participant 2 */}
                        <div className={`flex items-center gap-2.5 ${isP2Winner ? 'text-cyan-400' : 'text-white'}`}>
                          {p2Avatar ? (
                            <img
                              src={p2Avatar}
                              alt={p2Name}
                              className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center flex-shrink-0 border-2 border-slate-700">
                              <span className="text-white text-xs font-bold">?</span>
                            </div>
                          )}
                          <span className={`flex-1 truncate text-sm ${isP2Winner ? 'font-bold' : ''}`}>{p2Name}</span>
                          {match.status === 'completed' && (
                            <span className={`text-sm font-bold ${isP2Winner ? 'text-cyan-400' : 'text-slate-300'}`}>
                              {match.score2}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>

              {/* Vertical connector lines in the gap between rounds */}
              {!isLastRound && roundMatches.length > 1 && (
                <div className="absolute left-full top-0 bottom-0 w-16 pointer-events-none z-0" style={{ marginLeft: '64px' }}>
                  {roundMatches.map((match, matchIndex) => {
                    if (matchIndex % 2 === 0 && matchIndex < roundMatches.length - 1) {
                      // Each match card is approximately 120px tall, gap-8 is 32px (2rem)
                      const cardHeight = 120
                      const gap = 32
                      const totalHeight = cardHeight + gap
                      const topPosition = matchIndex * totalHeight + cardHeight / 2
                      const height = totalHeight
                      
                      return (
                        <div
                          key={match.id}
                          className="absolute w-[2px] bg-cyan-400/40"
                          style={{
                            top: `${topPosition}px`,
                            height: `${height}px`,
                            left: '0',
                            marginTop: '-1px',
                          }}
                        />
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

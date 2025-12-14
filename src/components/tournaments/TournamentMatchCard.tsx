'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TournamentMatch, TournamentWithHost, TournamentParticipant } from '@/types/tournaments'
import { MatchReportModal } from './MatchReportModal'
import { HostFinalizeModal } from './HostFinalizeModal'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface TournamentMatchCardProps {
  match: TournamentMatch
  tournament: TournamentWithHost
  onUpdate: () => void
}

export function TournamentMatchCard({ match, tournament, onUpdate }: TournamentMatchCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showReportModal, setShowReportModal] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [userParticipant, setUserParticipant] = useState<TournamentParticipant | null>(null)
  const [isLoadingParticipant, setIsLoadingParticipant] = useState(false)

  useEffect(() => {
    if (user && (match.status === 'pending' || match.status === 'in_progress')) {
      fetchUserParticipant()
    }
  }, [user, match])

  const fetchUserParticipant = async () => {
    if (!user) return

    setIsLoadingParticipant(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`)
      const data = await response.json()

      if (response.ok && data.participants) {
        const participant = data.participants.find(
          (p: TournamentParticipant) => p.user_id === user.id
        )
        setUserParticipant(participant || null)
      }
    } catch (error) {
      console.error('Error fetching participant:', error)
    } finally {
      setIsLoadingParticipant(false)
    }
  }

  const isUserInMatch = userParticipant && (
    userParticipant.id === match.participant1_id || userParticipant.id === match.participant2_id
  )
  const isHost = user && tournament.host_id === user.id
  const canSubmitReport = isUserInMatch && (match.status === 'pending' || match.status === 'in_progress')
  const canFinalize = isHost && match.status === 'in_progress'

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

  const handleCardClick = () => {
    router.push(`/tournaments/${tournament.id}/matches/${match.id}`)
  }

  return (
    <>
      <div 
        className="border border-slate-700/50 bg-slate-800/30 p-4 cursor-pointer hover:border-cyan-400/50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 font-title uppercase">
            Match {match.match_number}
          </span>
          <span className={`px-2 py-1 text-xs font-title uppercase text-white ${statusColors[match.status]}`}>
            {statusLabels[match.status]}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {match.participant1?.profile?.avatar_url ? (
                <img
                  src={match.participant1.profile.avatar_url}
                  alt={match.participant1.profile.username}
                  className="w-6 h-6 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0" />
              )}
              <span className={`text-sm truncate ${match.winner_id === match.participant1_id ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
                {match.participant1?.profile?.display_name || match.participant1?.profile?.username || 'TBD'}
              </span>
            </div>
            {match.status === 'completed' && (
              <span className="text-sm font-bold text-white ml-2">{match.score1}</span>
            )}
          </div>

          <div className="text-xs text-slate-500 text-center">VS</div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {match.participant2?.profile?.avatar_url ? (
                <img
                  src={match.participant2.profile.avatar_url}
                  alt={match.participant2.profile.username}
                  className="w-6 h-6 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0" />
              )}
              <span className={`text-sm truncate ${match.winner_id === match.participant2_id ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
                {match.participant2?.profile?.display_name || match.participant2?.profile?.username || 'TBD'}
              </span>
            </div>
            {match.status === 'completed' && (
              <span className="text-sm font-bold text-white ml-2">{match.score2}</span>
            )}
          </div>
        </div>

        {match.lobby_id && (
          <Link
            href={`/lobbies/${match.lobby_id}`}
            className="mt-3 block text-xs text-cyan-400 hover:text-cyan-300 text-center"
          >
            View Lobby →
          </Link>
        )}

        {/* Action Buttons */}
        {user && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2" onClick={(e) => e.stopPropagation()}>
            {canSubmitReport && (
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 px-3 py-1.5 text-xs font-title uppercase"
              >
                Submit Report
              </button>
            )}
            {canFinalize && (
              <button
                onClick={() => setShowFinalizeModal(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-xs font-title uppercase"
              >
                Finalize Match
              </button>
            )}
          </div>
        )}
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
            onUpdate()
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
            onUpdate()
            setShowFinalizeModal(false)
          }}
        />
      )}
    </>
  )
}

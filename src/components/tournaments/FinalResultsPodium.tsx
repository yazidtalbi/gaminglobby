'use client'

import { TournamentParticipant } from '@/types/tournaments'
import { Trophy, Medal, Award } from 'lucide-react'

interface FinalResultsPodiumProps {
  participants: TournamentParticipant[]
}

export function FinalResultsPodium({ participants }: FinalResultsPodiumProps) {
  const winner = participants.find(p => p.final_placement === 1)
  const secondPlace = participants.find(p => p.final_placement === 2)
  const thirdPlace = participants.find(p => p.final_placement === 3)

  // Only show if we have at least a winner
  if (!winner) return null

  return (
    <div>
      <h2 className="text-2xl font-title text-white mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        Final Results
      </h2>

      {/* Podium Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 2nd Place */}
        {secondPlace && (
          <div className="order-2 md:order-1 border border-slate-700/50 bg-slate-800/30 p-6 text-center rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Medal className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-title uppercase text-slate-400">2nd Place</span>
            </div>
            {secondPlace.profile?.avatar_url ? (
              <img
                src={secondPlace.profile.avatar_url}
                alt={secondPlace.profile.username || ''}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold">?</span>
              </div>
            )}
            <p className="text-lg font-bold text-slate-300">
              {secondPlace.profile?.display_name || secondPlace.profile?.username || 'Unknown'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Finalist</p>
          </div>
        )}

        {/* 1st Place (Champion) - Larger and centered */}
        <div className="order-1 md:order-2 border-2 border-yellow-400/50 bg-yellow-400/10 p-6 text-center rounded-lg relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3 mt-2">
            <span className="text-sm font-title uppercase text-yellow-400">Champion</span>
          </div>
          {winner.profile?.avatar_url ? (
            <img
              src={winner.profile.avatar_url}
              alt={winner.profile.username || ''}
              className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-yellow-400"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-3 flex items-center justify-center border-2 border-yellow-400">
              <span className="text-white font-bold text-xl">?</span>
            </div>
          )}
          <p className="text-xl font-bold text-yellow-400">
            {winner.profile?.display_name || winner.profile?.username || 'Unknown'}
          </p>
          <p className="text-xs text-yellow-300 mt-1">Tournament Winner</p>
        </div>

        {/* 3rd Place */}
        {thirdPlace && (
          <div className="order-3 border border-slate-700/50 bg-slate-800/30 p-6 text-center rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Award className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-title uppercase text-slate-400">3rd Place</span>
            </div>
            {thirdPlace.profile?.avatar_url ? (
              <img
                src={thirdPlace.profile.avatar_url}
                alt={thirdPlace.profile.username || ''}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold">?</span>
              </div>
            )}
            <p className="text-lg font-bold text-slate-300">
              {thirdPlace.profile?.display_name || thirdPlace.profile?.username || 'Unknown'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Top 3</p>
          </div>
        )}
      </div>
    </div>
  )
}

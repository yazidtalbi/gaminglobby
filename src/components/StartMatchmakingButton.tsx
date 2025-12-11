'use client'

import { useState } from 'react'
import { MatchmakingModal } from './MatchmakingModal'

interface TrendingGame {
  gameId: string
  count: number
}

interface StartMatchmakingButtonProps {
  trendingGames: TrendingGame[]
}

export function StartMatchmakingButton({ trendingGames }: StartMatchmakingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative w-full px-6 py-4 bg-slate-700/50 text-cyan-400 font-title text-base transition-colors duration-200 hover:bg-slate-700"
      >
        {/* Corner brackets */}
        <span className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t border-l border-cyan-400" />
        <span className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t border-r border-cyan-400" />
        <span className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b border-l border-cyan-400" />
        <span className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b border-r border-cyan-400" />
        <span className="relative z-10">&gt; START MATCHMAKING</span>
      </button>
      <MatchmakingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        trendingGames={trendingGames}
      />
    </>
  )
}


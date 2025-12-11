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
        className="relative px-6 py-4          bg-[#FF4D2E] text-white
         hover:bg-[#E24428]
         active:bg-[#C53A22]  font-title text-base transition-colors duration-200  whitespace-nowrap"
      >

        
        {/* Corner brackets */}
        <span className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t border-l border-slate-900" />
        <span className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t border-r border-slate-900" />
        <span className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b border-l border-slate-900" />
        <span className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b border-r border-slate-900" />
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


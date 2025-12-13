'use client'

import { RecentLobbyCard } from './RecentLobbyCard'
import ExpandMore from '@mui/icons-material/ExpandMore'

interface RecentLobbiesScrollProps {
  lobbies: Array<{
    id: string
    game_id: string
    game_name: string
    title: string
    host?: {
      username: string
      avatar_url: string | null
    }
    member_count?: number
    coverUrl?: string | null
  }>
}

export function RecentLobbiesScroll({ lobbies }: RecentLobbiesScrollProps) {
  const handleScroll = () => {
    const container = document.getElementById('recent-lobbies-scroll')
    if (container) {
      container.scrollBy({ left: 320, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth" id="recent-lobbies-scroll">
        {lobbies.map((lobby) => (
          <RecentLobbyCard key={lobby.id} lobby={lobby as any} coverUrl={lobby.coverUrl} />
        ))}
      </div>
      {/* Scroll Button */}
      <button
        onClick={handleScroll}
        className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-slate-900 to-transparent flex items-center justify-end pr-2 pointer-events-auto hover:from-slate-800 transition-colors"
      >
        <ExpandMore className="w-6 h-6 text-slate-400 hover:text-cyan-400 transition-colors rotate-[-90deg]" />
      </button>
    </div>
  )
}


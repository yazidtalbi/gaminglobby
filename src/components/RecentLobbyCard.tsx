'use client'

import Link from 'next/link'
import { Lobby } from '@/types/database'
import ExpandMore from '@mui/icons-material/ExpandMore'

interface RecentLobbyCardProps {
  lobby: Lobby & {
    host?: {
      username: string
      avatar_url: string | null
    }
    member_count?: number
  }
  coverUrl?: string | null
}

export function RecentLobbyCard({ lobby, coverUrl }: RecentLobbyCardProps) {
  return (
    <Link
      href={`/lobbies/${lobby.id}`}
      className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-200 group w-80 flex-shrink-0"
    >
      {/* Game Thumbnail - Square like sidebar */}
      <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600/50">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={lobby.game_name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <span className="text-slate-500 text-xs text-center px-2">{lobby.game_name.substring(0, 3)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-400 truncate">
          {lobby.game_name}
        </p>
        {lobby.host && (
          <p className="text-xs text-slate-500 truncate mt-0.5">
            by {lobby.host.username}
          </p>
        )}
      </div>

      {/* Caret Icon */}
      <div className="flex-shrink-0">
        <ExpandMore className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors rotate-[-90deg]" />
      </div>
    </Link>
  )
}


'use client'

import Link from 'next/link'
import { Users, Monitor, Gamepad, Clock } from 'lucide-react'
import { Lobby } from '@/types/database'

interface LobbyCardProps {
  lobby: Lobby & {
    host?: {
      username: string
      avatar_url: string | null
    }
    member_count?: number
  }
  className?: string
}

const platformIcons: Record<string, React.ReactNode> = {
  pc: <Monitor className="w-4 h-4" />,
  ps: <Gamepad className="w-4 h-4" />,
  xbox: <Gamepad className="w-4 h-4" />,
  switch: <Gamepad className="w-4 h-4" />,
  mobile: <Gamepad className="w-4 h-4" />,
  other: <Gamepad className="w-4 h-4" />,
}

const platformLabels: Record<string, string> = {
  pc: 'PC',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Mobile',
  other: 'Other',
}

const statusColors: Record<string, string> = {
  open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export function LobbyCard({ lobby, className = '' }: LobbyCardProps) {
  const timeAgo = getTimeAgo(new Date(lobby.created_at))

  return (
    <Link
      href={`/lobbies/${lobby.id}`}
      className={`
        block bg-slate-800/50 rounded-xl border border-slate-700/50 
        hover:border-emerald-500/50 hover:bg-slate-800
        transition-all duration-200 p-4 ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{lobby.title}</h3>
          <p className="text-sm text-slate-400 truncate mt-0.5">{lobby.game_name}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[lobby.status]}`}>
          {lobby.status === 'in_progress' ? 'In Progress' : lobby.status.charAt(0).toUpperCase() + lobby.status.slice(1)}
        </span>
      </div>

      {lobby.description && (
        <p className="text-sm text-slate-300 mt-2 line-clamp-2">{lobby.description}</p>
      )}

      <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
        {/* Platform */}
        <div className="flex items-center gap-1.5">
          {platformIcons[lobby.platform]}
          <span>{platformLabels[lobby.platform]}</span>
        </div>

        {/* Players */}
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>
            {lobby.member_count || 1}
            {lobby.max_players && `/${lobby.max_players}`}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock className="w-4 h-4" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Host */}
      {lobby.host && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
          <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden">
            {lobby.host.avatar_url ? (
              <img src={lobby.host.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
            )}
          </div>
          <span className="text-sm text-slate-400">
            Hosted by <span className="text-white">{lobby.host.username}</span>
          </span>
        </div>
      )}
    </Link>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}


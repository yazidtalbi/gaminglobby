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
  compact?: boolean
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
  open: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export function LobbyCard({ lobby, className = '', compact = false }: LobbyCardProps) {
  const timeAgo = getTimeAgo(new Date(lobby.created_at))

  if (compact) {
    return (
      <Link
        href={`/lobbies/${lobby.id}`}
        className={`
          flex items-center gap-3 p-3
          bg-slate-800/30 hover:bg-slate-800/60 border border-cyan-500/30 hover:border-cyan-500/50
          transition-all duration-200 ${className}
        `}
      >
        {/* Host Avatar */}
        <div className="w-8 h-8 bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600">
          {lobby.host?.avatar_url ? (
            <img src={lobby.host.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white text-sm truncate">{lobby.title}</h3>
            <span className={`px-1.5 py-0.5 text-xs font-medium border ${statusColors[lobby.status]}`}>
              {lobby.status === 'in_progress' ? 'Active' : 'Open'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              {platformIcons[lobby.platform]}
              {platformLabels[lobby.platform]}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {lobby.member_count || 1}{lobby.max_players && `/${lobby.max_players}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/lobbies/${lobby.id}`}
      className={`
        block bg-slate-800/50 border border-cyan-500/30 
        hover:border-cyan-500/50 hover:bg-slate-800
        transition-all duration-200 p-4 ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{lobby.title}</h3>
          <p className="text-sm text-slate-400 truncate mt-0.5">{lobby.game_name}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium border ${statusColors[lobby.status]}`}>
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
          <div className="w-6 h-6 bg-slate-700 overflow-hidden border border-slate-600">
            {lobby.host.avatar_url ? (
              <img src={lobby.host.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500" />
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


'use client'

import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

interface GameCardProps {
  id: string | number
  name: string
  coverUrl?: string | null
  showViewButton?: boolean
  className?: string
}

export function GameCard({ 
  id, 
  name, 
  coverUrl, 
  showViewButton = true,
  className = '' 
}: GameCardProps) {
  return (
    <div className={`group relative bg-slate-800/50 overflow-hidden border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 ${className}`}>
      {/* Cover Image */}
      <div className="aspect-[2/3] relative overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-slate-600" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-title text-white truncate text-sm">{name}</h3>
        
        {showViewButton && (
          <Link
            href={`/games/${id}`}
            className="mt-2 inline-flex items-center justify-center w-full px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white text-sm font-medium uppercase tracking-wider border border-cyan-500/30 transition-colors duration-200 relative"
          >
            <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
            <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
            <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
            <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
          >
            View Lobbies
          </Link>
        )}
      </div>
    </div>
  )
}


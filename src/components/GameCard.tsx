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
    <div className={`group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 ${className}`}>
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
        <h3 className="font-semibold text-white truncate text-sm">{name}</h3>
        
        {showViewButton && (
          <Link
            href={`/games/${id}`}
            className="mt-2 inline-flex items-center justify-center w-full px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            View Lobbies
          </Link>
        )}
      </div>
    </div>
  )
}


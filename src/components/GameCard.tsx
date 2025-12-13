'use client'

import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

interface GameCardProps {
  id: string | number
  name: string
  coverUrl?: string | null
  showViewButton?: boolean
  showTitle?: boolean
  square?: boolean
  className?: string
}

export function GameCard({ 
  id, 
  name, 
  coverUrl, 
  showViewButton = true,
  showTitle = true,
  square = false,
  className = '' 
}: GameCardProps) {
  return (
    <Link 
      href={`/games/${id}`}
      className={`group relative bg-slate-800/50 overflow-hidden lg:border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 block cursor-pointer h-full flex flex-col ${className}`}
    >
      {/* Cover Image */}
      <div className={square ? "aspect-square relative overflow-hidden rounded-lg" : "aspect-[2/3] relative overflow-hidden"}>
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
      {showTitle && (
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-title text-white text-sm line-clamp-2 mb-2">{name}</h3>
          
          {showViewButton && (
            <div className="mt-auto inline-flex items-center justify-center w-full px-3 py-1.5 bg-slate-700/50 group-hover:bg-slate-700 text-cyan-400 text-sm font-title transition-colors duration-200 relative pointer-events-none">
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-cyan-400" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-cyan-400" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-cyan-400" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-cyan-400" />
              <span className="relative z-10">&gt; VIEW</span>
            </div>
          )}
        </div>
      )}
    </Link>
  )
}


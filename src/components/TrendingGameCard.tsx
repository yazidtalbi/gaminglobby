'use client'

import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

interface TrendingGameCardProps {
  id: string | number
  name: string
  coverUrl?: string | null
}

export function TrendingGameCard({ 
  id, 
  name, 
  coverUrl
}: TrendingGameCardProps) {
  return (
    <Link 
      href={`/games/${id}`}
      className="group bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 p-6 block"
    >
      <div className="flex gap-6">
        {/* Game Image - Left Side */}
        <div className="w-40 h-48 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600/50">
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
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-title text-white text-xl mb-4 line-clamp-2 group-hover:text-cyan-400 transition-colors">
              {name}
            </h3>
          </div>
          
          {/* View Button */}
          <div className="inline-flex items-center justify-center w-fit px-4 py-2 bg-slate-700/50 group-hover:bg-cyan-600 text-cyan-400 group-hover:text-white text-sm font-title transition-colors duration-200 relative">
            {/* Corner brackets */}
            <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-cyan-400" />
            <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-cyan-400" />
            <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-cyan-400" />
            <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-cyan-400" />
            <span className="relative z-10">&gt; VIEW</span>
          </div>
        </div>
      </div>
    </Link>
  )
}


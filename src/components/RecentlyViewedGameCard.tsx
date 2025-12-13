'use client'

import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

interface RecentlyViewedGameCardProps {
  id: string | number
  name: string
  coverUrl?: string | null
}

export function RecentlyViewedGameCard({ 
  id, 
  name, 
  coverUrl
}: RecentlyViewedGameCardProps) {
  return (
    <Link
      href={`/games/${id}`}
      className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800/50 lg:border border-slate-700/50 hover:border-app-green-500/50 transition-colors"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
          <Gamepad2 className="w-8 h-8 text-white/50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-base font-title text-white line-clamp-2">
            {name}
          </p>
        </div>
      </div>
    </Link>
  )
}


'use client'

import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'

interface GameLogoCardProps {
  id: string | number
  name: string
  logoUrl?: string | null
  className?: string
}

export function GameLogoCard({ 
  id, 
  name, 
  logoUrl,
  className = '' 
}: GameLogoCardProps) {

  return (
    <Link 
      href={`/games/${id}`}
      className={`group relative bg-slate-800/50 overflow-hidden transition-all duration-300 block ${className}`}
    >
      {/* Logo Image - Horizontal aspect ratio for logos */}
      <div className="aspect-[16/9] relative overflow-hidden bg-slate-800/50 flex items-center justify-center p-12">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="max-w-[60%] max-h-[60%] w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-slate-600" />
          </div>
        )}
      </div>
    </Link>
  )
}


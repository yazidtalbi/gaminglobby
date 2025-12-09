'use client'

import { GameGuide } from '@/types/database'
import { ExternalLink, BookOpen, ImageOff } from 'lucide-react'

interface LobbyGuideCardProps {
  guide: GameGuide
  className?: string
}

export function LobbyGuideCard({ guide, className = '' }: LobbyGuideCardProps) {
  const title = guide.og_title || guide.title
  const description = guide.og_description
  const imageUrl = guide.og_image_url

  return (
    <div className={`bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
        <BookOpen className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">Lobby Guide</span>
      </div>
      
      <a
        href={guide.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 p-4"
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 h-16 bg-slate-700 rounded-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>

        {/* External link */}
        <div className="flex-shrink-0 self-center">
          <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-emerald-600 transition-colors">
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </a>
    </div>
  )
}


'use client'

import { GameGuide } from '@/types/database'
import { ExternalLink, FileText, ImageOff } from 'lucide-react'

interface GuideListProps {
  guides: GameGuide[]
  className?: string
}

export function GuideList({ guides, className = '' }: GuideListProps) {
  if (guides.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No guides yet.</p>
        <p className="text-sm text-slate-500">Share your first guide!</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      {guides.map((guide) => (
        <GuideCard key={guide.id} guide={guide} />
      ))}
    </div>
  )
}

function GuideCard({ guide }: { guide: GameGuide }) {
  const title = guide.og_title || guide.title
  const description = guide.og_description
  const imageUrl = guide.og_image_url

  return (
    <a
      href={guide.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-200"
    >
      {/* OG Image */}
      <div className="aspect-video bg-slate-700 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-slate-600" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* External link indicator */}
        <div className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-medium text-white line-clamp-2 group-hover:text-app-green-400 transition-colors">
          {title}
        </h4>
        {description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </a>
  )
}


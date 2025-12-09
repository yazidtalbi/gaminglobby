'use client'

import { GameCommunity } from '@/types/database'
import { ExternalLink, MessageSquare, Globe, Radio, HelpCircle } from 'lucide-react'

interface CommunityListProps {
  communities: GameCommunity[]
  className?: string
}

const typeIcons: Record<string, React.ReactNode> = {
  discord: <MessageSquare className="w-4 h-4" />,
  mumble: <Radio className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  other: <HelpCircle className="w-4 h-4" />,
}

const typeColors: Record<string, string> = {
  discord: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  mumble: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  website: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export function CommunityList({ communities, className = '' }: CommunityListProps) {
  if (communities.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No communities yet.</p>
        <p className="text-sm text-slate-500">Be the first to add one!</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {communities.map((community) => (
        <div
          key={community.id}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${typeColors[community.type]}`}>
                  {typeIcons[community.type]}
                  {community.type.charAt(0).toUpperCase() + community.type.slice(1)}
                </span>
              </div>
              <h4 className="font-medium text-white">{community.name}</h4>
              {community.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{community.description}</p>
              )}
            </div>
            <a
              href={community.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Open
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}


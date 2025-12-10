import Link from 'next/link'
import { SportsEsports } from '@mui/icons-material'

interface FeaturedGameCardProps {
  id: string | number
  name: string
  coverUrl?: string | null
  className?: string
}

export function FeaturedGameCard({ 
  id, 
  name, 
  coverUrl, 
  className = '' 
}: FeaturedGameCardProps) {
  return (
    <div className={`group relative bg-slate-800/50 overflow-hidden border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 h-full flex flex-col ${className}`}>
      {/* Cover Image - Full height */}
      <div className="flex-1 relative overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <SportsEsports className="w-16 h-16 text-slate-600" />
          </div>
        )}
      </div>

      {/* Info Section - Just the button */}
      <div className="p-4 bg-slate-800/50 border-t border-cyan-500/30">
        <Link
          href={`/games/${id}`}
          className="inline-flex items-center justify-center w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-cyan-400 font-title text-sm transition-colors duration-200 relative"
        >
          {/* Corner brackets */}
          <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-cyan-400" />
          <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-cyan-400" />
          <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-cyan-400" />
          <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-cyan-400" />
          <span className="relative z-10">&gt; VIEW LOBBIES</span>
        </Link>
      </div>
    </div>
  )
}


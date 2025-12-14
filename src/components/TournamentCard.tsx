import Link from 'next/link'
import { TournamentWithHost } from '@/types/tournaments'
import { getTournamentState } from '@/lib/tournaments/state'
import { Trophy, Medal, Award, Calendar, Users, Gamepad2 } from 'lucide-react'

interface TournamentCardProps {
  tournament: TournamentWithHost
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const tournamentState = getTournamentState(tournament)
  const startDate = new Date(tournament.start_at)
  const registrationDeadline = new Date(tournament.registration_deadline)

  // Get status badge color
  const getStatusColor = () => {
    switch (tournamentState) {
      case 'upcoming':
        return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
      case 'live':
        return 'bg-lime-500/20 border-lime-500/50 text-lime-400'
      case 'completed':
        return 'bg-slate-500/20 border-slate-500/50 text-slate-400'
      default:
        return 'bg-slate-500/20 border-slate-500/50 text-slate-400'
    }
  }

  const getStatusText = () => {
    switch (tournamentState) {
      case 'upcoming':
        return 'Upcoming'
      case 'live':
        return 'Live'
      case 'completed':
        return 'Completed'
      default:
        return tournament.status
    }
  }

  // Collect prize badges
  const prizes = []
  if (tournament.badge_1st_label) {
    prizes.push({
      label: tournament.badge_1st_label,
      imageUrl: tournament.badge_1st_image_url,
      place: '1st',
      icon: Trophy,
      color: 'text-yellow-400',
    })
  }
  if (tournament.badge_2nd_label) {
    prizes.push({
      label: tournament.badge_2nd_label,
      imageUrl: tournament.badge_2nd_image_url,
      place: '2nd',
      icon: Medal,
      color: 'text-slate-300',
    })
  }
  if (tournament.badge_3rd_label) {
    prizes.push({
      label: tournament.badge_3rd_label,
      imageUrl: tournament.badge_3rd_image_url,
      place: '3rd',
      icon: Award,
      color: 'text-amber-600',
    })
  }

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className="group relative h-full bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
        {/* Background Image */}
        {tournament.cover_url && (
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
            <img
              src={tournament.cover_url}
              alt={tournament.game_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
          </div>
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-title text-white mb-1 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                {tournament.title}
              </h3>
              <p className="text-sm text-slate-400 truncate">{tournament.game_name}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-title border rounded flex-shrink-0 ml-2 ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {/* Tournament Details */}
          <div className="space-y-2 mb-4 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tournament.current_participants}/{tournament.max_participants} participants</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tournament.platform}</span>
            </div>
          </div>

          {/* Prize Badges */}
          {prizes.length > 0 && (
            <div className="mt-auto pt-4 border-t border-slate-700/50">
              <p className="text-xs font-title text-slate-500 uppercase mb-2">Prizes</p>
              <div className="flex gap-2">
                {prizes.map((prize, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-slate-800/50 border border-slate-700/30 rounded hover:border-cyan-500/50 transition-colors"
                  >
                    {prize.imageUrl ? (
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img
                          src={prize.imageUrl}
                          alt={prize.label}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center">
                        <prize.icon className={`w-6 h-6 ${prize.color}`} />
                      </div>
                    )}
                    <p className="text-[10px] font-title text-slate-400 uppercase text-center line-clamp-1">
                      {prize.place}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

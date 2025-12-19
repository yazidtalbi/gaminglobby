import { Gamepad2, Users, TrendingUp } from 'lucide-react'

interface TrustStatsProps {
  gamesIndexed: number
  lobbies7d: number
  activePlayers7d: number
}

export function TrustStats({ gamesIndexed, lobbies7d, activePlayers7d }: TrustStatsProps) {
  const formatCount = (count: number) => {
    if (count === 0) return 'Growing'
    if (count < 1000) return count.toLocaleString()
    return `${(count / 1000).toFixed(1)}k`
  }

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 mb-2">
          <Gamepad2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="text-2xl font-title font-bold text-white mb-1">
          {formatCount(gamesIndexed)}
        </div>
        <div className="text-xs text-slate-400">Games indexed</div>
      </div>
      <div>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 mb-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="text-2xl font-title font-bold text-white mb-1">
          {formatCount(lobbies7d)}
        </div>
        <div className="text-xs text-slate-400">Lobbies (7d)</div>
      </div>
      <div>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 mb-2">
          <Users className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="text-2xl font-title font-bold text-white mb-1">
          {formatCount(activePlayers7d)}
        </div>
        <div className="text-xs text-slate-400">Active players (7d)</div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface GameShowcaseProps {
  gameName: string
}

const gameData: Record<string, { discount: string; gradient: string; bgImage: string }> = {
  'Counter-Strike 2': {
    discount: 'DISCOUNT UP TO 70%',
    gradient: 'from-orange-600/20 to-red-600/20',
    bgImage: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
  },
  'Team Fortress 2': {
    discount: 'DISCOUNT UP TO 60%',
    gradient: 'from-slate-600/20 to-slate-700/20',
    bgImage: 'bg-gradient-to-br from-slate-500/10 to-slate-600/10',
  },
  'Rust': {
    discount: 'ACTIVE LOBBIES',
    gradient: 'from-green-600/20 to-emerald-600/20',
    bgImage: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
  },
}

const mockLobbies = [
  { name: 'Competitive 5v5', players: '8/10', time: '2m ago' },
  { name: 'Casual DM', players: '4/8', time: '5m ago' },
  { name: 'Wingman', players: '1/2', time: '12m ago' },
  { name: 'Deathmatch', players: '6/8', time: '8m ago' },
]

export function GameShowcase({ gameName }: GameShowcaseProps) {
  const game = gameData[gameName] || gameData['Counter-Strike 2']
  const slug = gameName.toLowerCase().replace(/\s+/g, '-')

  return (
    <section className="relative z-10 py-16 lg:py-24 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Banner */}
          <div className={`relative h-80 rounded-lg border border-slate-800 overflow-hidden ${game.bgImage} ${game.gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
            <div className="relative h-full flex flex-col justify-between p-10">
              <div>
                <div className="text-lg font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                  {game.discount}
                </div>
                <h3 className="text-5xl font-title font-bold text-white mb-4">
                  {gameName.toUpperCase()} LOBBIES
                </h3>
              </div>
              <Button
                asChild
                className="w-fit bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold"
              >
                <Link href={`/games/${slug}`}>
                  VIEW ALL LOBBIES
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Lobbies Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {mockLobbies.map((lobby, index) => (
              <Card
                key={index}
                className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                        {lobby.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {gameName}
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{lobby.players} players</span>
                    <span>{lobby.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

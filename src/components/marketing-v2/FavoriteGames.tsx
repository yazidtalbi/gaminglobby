import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const favoriteGames = [
  {
    name: 'Counter-Strike 2',
    slug: 'counter-strike-2',
    players: '1 Million+',
    gradient: 'from-orange-600/20 to-red-600/20',
    bgImage: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
  },
  {
    name: 'Team Fortress 2',
    slug: 'team-fortress-2',
    players: '250 Thousand+',
    gradient: 'from-slate-600/20 to-slate-700/20',
    bgImage: 'bg-gradient-to-br from-slate-500/10 to-slate-600/10',
  },
  {
    name: 'Rust',
    slug: 'rust',
    players: '30 Thousand+',
    gradient: 'from-green-600/20 to-emerald-600/20',
    bgImage: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
  },
]

export function FavoriteGames() {
  return (
    <section className="relative z-10 py-16 lg:py-24 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-12 text-center">
          JOIN LOBBIES FROM YOUR FAVORITE GAMES
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {favoriteGames.map((game, index) => (
            <Link
              key={index}
              href={`/games/${game.slug}`}
              className="group relative h-64 rounded-lg border border-slate-800 overflow-hidden hover:border-cyan-500/30 transition-all"
            >
              <div className={`absolute inset-0 ${game.bgImage} ${game.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="relative h-full flex flex-col justify-between p-8">
                <div>
                  <h3 className="text-3xl font-title font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {game.name}
                  </h3>
                  <div className="text-lg text-slate-300 font-semibold">
                    {game.players} Players
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-fit border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Browse Lobbies
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

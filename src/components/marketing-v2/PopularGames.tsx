import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight } from 'lucide-react'

const popularGames = [
  {
    name: 'Counter-Strike 2',
    slug: 'counter-strike-2',
    lobbies: 12,
    players: 89,
  },
  {
    name: 'Team Fortress 2',
    slug: 'team-fortress-2',
    lobbies: 8,
    players: 45,
  },
  {
    name: 'Battlefield 3',
    slug: 'battlefield-3',
    lobbies: 5,
    players: 32,
  },
  {
    name: 'Left 4 Dead 2',
    slug: 'left-4-dead-2',
    lobbies: 4,
    players: 21,
  },
]

export function PopularGames() {
  return (
    <section className="relative z-10 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-12 text-center">
          EXPLORE BEST OFFERS FOR POPULAR GAMES
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularGames.map((game, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {game.name}
                  </h3>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-cyan-400"
                  >
                    <Link href={`/games/${game.slug}`}>
                      <Plus className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-slate-400">
                    <span className="font-semibold text-white">{game.lobbies}</span> active lobbies
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="font-semibold text-white">{game.players}</span> players online
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Link href={`/games/${game.slug}`}>
                    View Lobbies
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Search, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const previewGames = [
  { name: 'Counter-Strike 2', lobbies: 12, players: 89 },
  { name: 'Team Fortress 2', lobbies: 8, players: 45 },
  { name: 'Battlefield 3', lobbies: 5, players: 32 },
  { name: 'Left 4 Dead 2', lobbies: 4, players: 21 },
  { name: 'Quake', lobbies: 3, players: 18 },
  { name: 'Doom', lobbies: 2, players: 12 },
]

export function GameDiscoveryPreview() {
  return (
    <section className="relative z-10 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            Discover games, find players
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Browse thousands of games. See activity, join lobbies, and find community links—all in one place.
          </p>

          {/* Search Input */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search games (e.g., Battlefield 3)"
                className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
                disabled
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Search functionality coming soon</p>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {previewGames.map((game, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{game.name}</h3>
                  <Badge variant="success" className="text-xs">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{game.lobbies} lobbies</span>
                  <span>•</span>
                  <span>{game.players} players</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Internal Links */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/games"
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Browse all games
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/find-players/counter-strike-2"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Find Counter-Strike 2 players
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/games/counter-strike-2"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Counter-Strike 2 hub
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

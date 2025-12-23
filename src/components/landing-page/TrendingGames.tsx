import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { getGameById, getHorizontalCover } from '@/lib/steamgriddb'
import { generateSlug } from '@/lib/slug'
import { unstable_cache } from 'next/cache'

interface TrendingGame {
  name: string
  id: number
  horizontalCoverUrl?: string | null
  searchCount: number
}

async function getTrendingGamesData(): Promise<TrendingGame[]> {
  const supabase = createPublicSupabaseClient()
  
  // Get games with most searches in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data } = await supabase
    .from('game_search_events')
    .select('game_id')
    .gte('created_at', sevenDaysAgo.toISOString())

  if (!data || data.length === 0) return []

  // Count occurrences
  const counts: Record<string, number> = {}
  data.forEach((event) => {
    counts[event.game_id] = (counts[event.game_id] || 0) + 1
  })

  // Sort by count and get top 4
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // Fetch game data for each trending game
  const gamesWithData = await Promise.all(
    sorted.map(async ([gameId, searchCount]) => {
      try {
        const gameIdNum = parseInt(gameId, 10)
        if (isNaN(gameIdNum)) return null

        const gameData = await getGameById(gameIdNum)
        if (!gameData) return null

        const horizontalCover = await getHorizontalCover(gameIdNum)
        
        return {
          name: gameData.name,
          id: gameIdNum,
          horizontalCoverUrl: horizontalCover?.url || gameData.horizontalCoverUrl || null,
          searchCount,
        } as TrendingGame
      } catch (error) {
        console.error(`Error fetching game ${gameId}:`, error)
        return null
      }
    })
  )

  return gamesWithData.filter((game): game is TrendingGame => {
    return game !== null && game !== undefined
  })
}

const getTrendingGames = unstable_cache(
  getTrendingGamesData,
  ['landing-trending-games'],
  { revalidate: 300 } // Cache for 5 minutes
)

export async function TrendingGames() {
  const games = await getTrendingGames()

  // If no trending games from search, show empty state or fallback
  if (games.length === 0) {
    return (
      <section className="relative z-10 py-12 lg:py-16">
        <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
          <h2 className="text-3xl lg:text-4xl font-title font-bold text-white mb-6 lg:mb-8 text-left">
            EXPLORE THE TRENDING GAMES
          </h2>
          <div className="text-center text-slate-400 text-sm">
            <p>No trending games at the moment</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative z-10 py-12 lg:py-16">
      <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <h2 className="text-3xl lg:text-4xl font-title font-bold text-white mb-6 lg:mb-8 text-left">
          EXPLORE THE TRENDING GAMES
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game, index) => {
            const slug = generateSlug(game.name)
            return (
              <Card
                key={game.id}
                className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all cursor-pointer group overflow-hidden"
              >
                <CardContent className="p-0">
                  <Link href={`/games/${slug}`}>
                    <div className="relative w-full bg-slate-800" style={{ aspectRatio: '1 / 1' }}>
                      {game.horizontalCoverUrl ? (
                        <Image
                          src={game.horizontalCoverUrl}
                          alt={game.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <span className="text-slate-600 text-sm">{game.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 lg:p-8 text-left">
                      <h3 className="text-sm lg:text-base font-bold text-white mb-6 lg:mb-8 group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {game.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="text-xs lg:text-sm font-bold text-white">2.8K PLAYERS</div>
                          <div className="text-[10px] lg:text-xs text-white">10 LOBBIES</div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 lg:h-11 lg:w-11 p-2 bg-black text-white hover:bg-slate-900"
                        >
                          <Link href={`/games/${slug}`}>
                            <ArrowRight className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

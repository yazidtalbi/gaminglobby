import { GameSearch } from '@/components/GameSearch'
import { LobbyCard } from '@/components/LobbyCard'
import { GameCard } from '@/components/GameCard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Gamepad2, Users, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'

async function getTrendingGames() {
  const supabase = await createServerSupabaseClient()
  
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

  // Sort by count and get top 6
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return sorted.map(([gameId, count]) => ({ gameId, count }))
}

async function getRecentLobbies() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('lobbies')
    .select(`
      *,
      host:profiles!lobbies_host_id_fkey(username, avatar_url),
      lobby_members(count)
    `)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(4)

  return data?.map((lobby) => ({
    ...lobby,
    member_count: (lobby.lobby_members as unknown as { count: number }[])?.[0]?.count || 1,
  })) || []
}

export default async function HomePage() {
  const [trendingGames, recentLobbies] = await Promise.all([
    getTrendingGames(),
    getRecentLobbies(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-title mb-6">
            <Sparkles className="w-4 h-4" />
            Find Your Squad
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-title text-white mb-6">
            Game lobbies,{' '}
            <span className="gradient-text">made simple</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10">
            Search any game, find active lobbies, and connect with players. No more solo queuing.
          </p>

          {/* Search */}
          <div className="max-w-xl">
            <GameSearch 
              placeholder="Search for any game..." 
              size="lg"
              autoFocus
              showQuickMatch={true}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-12 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <span>1000+ Games</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Active Lobbies</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="w-5 h-5 text-fuchsia-400" />
              <span>Growing Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Lobbies */}
      {recentLobbies.length > 0 && (
        <section className="py-12 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-title text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-cyan-400" />
                Active Lobbies
              </h2>
              <Link
                href="/games"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all games →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentLobbies.map((lobby) => (
                <LobbyCard key={lobby.id} lobby={lobby} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Games */}
      {trendingGames.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-title text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                Trending Games
              </h2>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {trendingGames.map(({ gameId }) => (
                <TrendingGameCard key={gameId} gameId={gameId} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-title text-white mb-4">
            Ready to find your squad?
          </h2>
          <p className="text-slate-400 mb-8">
            Search for your favorite game and join a lobby in seconds.
          </p>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-title transition-all duration-200 border border-cyan-500/30 relative"
          >
            <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
            <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
            <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
            <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
          >
            <Gamepad2 className="w-5 h-5" />
            Browse Games
          </Link>
        </div>
      </section>
    </div>
  )
}

async function TrendingGameCard({ gameId }: { gameId: string }) {
  // Fetch game details from SteamGridDB
  try {
    const response = await fetch(
      `${process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'}/games/id/${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STEAMGRIDDB_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      return <GameCard id={gameId} name="Unknown Game" />
    }

    const data = await response.json()
    const game = data.data?.[0]

    if (!game) {
      return <GameCard id={gameId} name="Unknown Game" />
    }

    // Fetch cover
    const coverResponse = await fetch(
      `${process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'}/grids/game/${gameId}?dimensions=600x900`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STEAMGRIDDB_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )

    let coverUrl = null
    if (coverResponse.ok) {
      const coverData = await coverResponse.json()
      coverUrl = coverData.data?.[0]?.thumb || coverData.data?.[0]?.url || null
    }

    return <GameCard id={gameId} name={game.name} coverUrl={coverUrl} />
  } catch {
    return <GameCard id={gameId} name="Unknown Game" />
  }
}

import { GameSearch } from '@/components/GameSearch'
import { LobbyCard } from '@/components/LobbyCard'
import { RecentLobbiesScroll } from '@/components/RecentLobbiesScroll'
import { RecentLobbyCard } from '@/components/RecentLobbyCard'
import { GameCard } from '@/components/GameCard'
import { EventCard } from '@/components/EventCard'
import { FeaturedGameCard } from '@/components/FeaturedGameCard'
import { StartMatchmakingButton } from '@/components/StartMatchmakingButton'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGameById } from '@/lib/steamgriddb'
import SportsEsports from '@mui/icons-material/SportsEsports'
import People from '@mui/icons-material/People'
import TrendingUp from '@mui/icons-material/TrendingUp'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import EventIcon from '@mui/icons-material/Event'
import Bolt from '@mui/icons-material/Bolt'
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

  // Sort by count and get top 5
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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

async function getUpcomingEvents() {
  const supabase = await createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['scheduled', 'ongoing'])
    .gte('ends_at', now) // Only events that haven't ended yet
    .order('starts_at', { ascending: true })
    .limit(4)

  if (!events || events.length === 0) return []

  // Get participant counts for each event
  const eventsWithCounts = await Promise.all(
    events.map(async (event) => {
      const { count } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'in')

      return {
        event,
        participantCount: count || 0,
      }
    })
  )

  return eventsWithCounts
}

export default async function HomePage() {
  const [trendingGames, recentLobbies, upcomingEvents] = await Promise.all([
    getTrendingGames(),
    getRecentLobbies(),
    getUpcomingEvents(),
  ])

  // Get featured game (first trending game, or fallback to a popular game)
  let featuredGame = null
  if (trendingGames.length > 0) {
    try {
      const gameId = parseInt(trendingGames[0].gameId, 10)
      if (!isNaN(gameId)) {
        const game = await getGameById(gameId)
        if (game) {
          featuredGame = {
            id: gameId,
            name: game.name,
            coverUrl: game.coverUrl || null,
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Fallback to Counter-Strike if no trending game found
  if (!featuredGame) {
    try {
      // Counter-Strike 2 Steam ID: 730
      const game = await getGameById(730)
      if (game) {
        featuredGame = {
          id: 730,
          name: game.name,
          coverUrl: game.coverUrl || null,
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Fetch cover images for recent lobbies
  const recentLobbiesWithCovers = await Promise.all(
    recentLobbies.slice(0, 10).map(async (lobby) => {
      let coverUrl = null
      try {
        const gameIdNum = parseInt(lobby.game_id, 10)
        if (!isNaN(gameIdNum)) {
          const game = await getGameById(gameIdNum)
          coverUrl = game?.squareCoverThumb || game?.squareCoverUrl || null
        }
      } catch {
        // Ignore errors
      }
      return {
        ...lobby,
        coverUrl,
      }
    })
  )

  return (
    <div className="min-h-screen   pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Recent Lobbies - Above Hero 
        {recentLobbies.length > 0 && (
          <section className="mb-8 flex gap-4">
            <RecentLobbiesScroll lobbies={recentLobbiesWithCovers} />       <RecentLobbiesScroll lobbies={recentLobbiesWithCovers} />       <RecentLobbiesScroll lobbies={recentLobbiesWithCovers} />
          </section>
        )}*/}

        {/* Hero Section */}
        <div className="relative mb-8 overflow-visible">
          <section className="relative" style={{
            background: 'linear-gradient(0deg, #2F3B52 0%, #162032 70%, #162032 100%)'
          }}>
            {/* Corner brackets 
            <span className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t border-l border-cyan-400" />
            <span className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t border-r border-cyan-400" />
            <span className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b border-l border-cyan-400" />
            <span className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b border-r border-cyan-400" />*/}
            <div className="relative px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-12 flex items-center min-h-[450px]">
              <div className="text-left  z-10">
                {/* Badge - Image style with cyan dash */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-0.5 bg-cyan-400" />
                  <span className="text-cyan-400 font-title text-sm uppercase tracking-wider">
                    all Gaming Communities in one place
                  </span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-title text-white mb-4">
                  Matchmaking, <br/>your way
                </h1>
                <p className="text-xs sm:text-base text-white max-w-md mb-6 max-w-lg">
                Join gaming communities from every title, explore lobbies, browse directories, and match with new players.
                </p>

                {/* Start Matchmaking Button */}
                <div className="w-full max-w-4xl">
                  <div className="flex items-center gap-4 mb-6">
                    <StartMatchmakingButton trendingGames={trendingGames} />
                    <Link
                      href="/games"
                      className="relative px-6 py-4 bg-slate-800 border-white/70 font-title text-base transition-colors duration-200 hover:bg-white/10 whitespace-nowrap"
                    >
                      {/* Corner brackets */}
                      <span className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t border-l border-white/70" />
                      <span className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t border-r border-white/70" />
                      <span className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b border-l border-white/70" />
                      <span className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b border-r border-white/70" />
                      <span className="relative z-10">&gt; EXPLORE</span>
                    </Link>
                  </div>
                  {/* Active Users */}
                  <div className="flex items-center gap-2 mt-3 pt-3">
                    <People className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300 font-title">+2k active users</span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  {/* Separator line 
                  <div className="border-t border-slate-600/50 mb-6"></div>*/}
                  
                  {/* Stats grid  
                  <div className="flex items-center">
                    <div className="flex flex-col items-start pr-6 border-r border-slate-600/50">
                      <span className="text-3xl font-bold text-cyan-400 mb-1">50K+</span>
                      <span className="text-xs text-white uppercase font-title">GAMES</span>
                    </div>
                    <div className="flex flex-col items-start px-6 border-r border-slate-600/50">
                      <span className="text-3xl font-bold text-cyan-400 mb-1">FAST</span>
                      <span className="text-xs text-white uppercase font-title">MATCHMAKING</span>
                    </div>
                    <div className="flex flex-col items-start pl-6">
                      <span className="text-3xl font-bold text-cyan-400 mb-1">ALL</span>
                      <span className="text-xs text-white uppercase font-title">COMMUNITIES</span>
                    </div>
                  </div>*/}
                </div>
              </div>
            </div>
          </section>
          
          {/* Image on the right - fixed bottom right */}
          <img 
            src="https://iili.io/f5dUyv9.png" 
            alt="Hero character" 
            className="hidden lg:block"
            style={{
              display: "block",
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
          />
        </div>



      </div>

     

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
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {trendingGames.map(({ gameId }) => (
                <TrendingGameCard key={gameId} gameId={gameId} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-title text-white flex items-center gap-2">
              <EventIcon className="w-6 h-6 text-cyan-400" />
              Upcoming Events
            </h2>
            {upcomingEvents.length > 0 && (
              <Link
                href="/events"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all events →
              </Link>
            )}
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {upcomingEvents.map(({ event, participantCount }) => {
                // Fetch cover image for each event
                return (
                  <EventCardWithCover
                    key={event.id}
                    event={event}
                    participantCount={participantCount}
                  />
                )
              })}
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
              <p className="text-slate-400">No upcoming events scheduled. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Lobbies */}
      {recentLobbies.length > 0 && (
        <section className="py-12 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-title text-white flex items-center gap-2">
                <People className="w-6 h-6 text-cyan-400" />
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
    </div>
  )
}

async function RecentLobbyCardWithCover({
  lobby,
}: {
  lobby: any
}) {
  // Fetch square cover image for the game (like sidebar)
  let coverUrl = null
  try {
    const gameIdNum = parseInt(lobby.game_id, 10)
    if (!isNaN(gameIdNum)) {
      const game = await getGameById(gameIdNum)
      coverUrl = game?.squareCoverThumb || game?.squareCoverUrl || null
    }
  } catch {
    // Ignore errors
  }

  return <RecentLobbyCard lobby={lobby} coverUrl={coverUrl} />
}

async function EventCardWithCover({
  event,
  participantCount,
}: {
  event: any
  participantCount: number
}) {
  // Fetch cover image directly from SteamGridDB (server-side)
  let coverUrl = null
  try {
    const apiBase = process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'
    const apiKey = process.env.STEAMGRIDDB_API_KEY
    
    if (apiKey) {
      const coverResponse = await fetch(
        `${apiBase}/grids/game/${event.game_id}?dimensions=600x900`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          next: { revalidate: 3600 },
        }
      )

      if (coverResponse.ok) {
        const coverData = await coverResponse.json()
        coverUrl = coverData.data?.[0]?.thumb || coverData.data?.[0]?.url || null
      }
    }
  } catch {
    // Ignore errors
  }

  return <EventCard event={event} coverUrl={coverUrl} participantCount={participantCount} />
}

async function TrendingGameCard({ gameId }: { gameId: string }) {
  // Fetch game details directly using server-side function
  try {
    const gameIdNum = parseInt(gameId, 10)
    if (isNaN(gameIdNum)) {
      return <GameCard id={gameId} name="Unknown Game" />
    }

    const game = await getGameById(gameIdNum)

    if (!game) {
      return <GameCard id={gameId} name="Unknown Game" />
    }

    return <GameCard id={gameId} name={game.name} coverUrl={game.coverThumb || game.coverUrl} />
  } catch (error) {
    console.error('Error fetching trending game:', gameId, error)
    return <GameCard id={gameId} name="Unknown Game" />
  }
}


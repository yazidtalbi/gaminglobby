import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { siteUrl, siteName } from '@/lib/seo/site'

export const metadata: Metadata = {
  ...createMetadata({
    title: 'Apoxer | Gaming Matchmaking, Lobbies & Player Communities',
    description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
    path: '/',
  }),
  // Override title to avoid template duplication since it already includes site name
  title: {
    absolute: 'Apoxer | Gaming Matchmaking, Lobbies & Player Communities',
  },
}
import { LobbyCard } from '@/components/LobbyCard'
import { RecentLobbyCard } from '@/components/RecentLobbyCard'
import { GameCard } from '@/components/GameCard'
import { GameLogoCard } from '@/components/GameLogoCard'
import { EventCard } from '@/components/EventCard'
import { StartMatchmakingButton } from '@/components/StartMatchmakingButton'
import { PeopleYouMightLikeCard } from '@/components/PeopleYouMightLikeCard'
import { RecentlyViewedGameCard } from '@/components/RecentlyViewedGameCard'
import { MostSearchedCarousel } from '@/components/MostSearchedCarousel'
import { createServerSupabaseClient, createPublicSupabaseClient } from '@/lib/supabase/server'
import { getGameById } from '@/lib/steamgriddb'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import People from '@mui/icons-material/People'
import TrendingUp from '@mui/icons-material/TrendingUp'
import EventIcon from '@mui/icons-material/Event'
import History from '@mui/icons-material/History'
import Link from 'next/link'

const getTrendingGames = unstable_cache(
  async () => {
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

    // Sort by count and get top 5
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return sorted.map(([gameId, count]) => ({ gameId, count }))
  },
  ['trending-games'],
  { revalidate: 300 } // Cache for 5 minutes
)

const getRecentLobbies = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data } = await supabase
      .from('lobbies')
      .select(`
        *,
        host:profiles!lobbies_host_id_fkey(username, avatar_url)
      `)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(4)

    if (!data || data.length === 0) return []

    // Get member counts in a single query
    const lobbyIds = data.map(l => l.id)
    const { data: memberCounts } = await supabase
      .from('lobby_members')
      .select('lobby_id')
      .in('lobby_id', lobbyIds)

    // Count members per lobby
    const counts: Record<string, number> = {}
    memberCounts?.forEach(m => {
      counts[m.lobby_id] = (counts[m.lobby_id] || 0) + 1
    })

    return data.map((lobby) => ({
      ...lobby,
      member_count: counts[lobby.id] || 1,
    }))
  },
  ['recent-lobbies'],
  { revalidate: 60 } // Cache for 1 minute (lobbies change frequently)
)

const getUpcomingEvents = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
    const now = new Date().toISOString()

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('status', ['scheduled', 'ongoing'])
      .gte('ends_at', now) // Only events that haven't ended yet
      .order('starts_at', { ascending: true })
      .limit(4)

    if (!events || events.length === 0) return []

    // Get all participant counts in a single query (fix N+1 problem)
    const eventIds = events.map(e => e.id)
    const { data: participants } = await supabase
      .from('event_participants')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'in')

    // Count participants per event
    const counts: Record<string, number> = {}
    participants?.forEach(p => {
      counts[p.event_id] = (counts[p.event_id] || 0) + 1
    })

    return events.map((event) => ({
      event,
      participantCount: counts[event.id] || 0,
    }))
  },
  ['upcoming-events'],
  { revalidate: 120 } // Cache for 2 minutes
)

async function getPeopleYouMightLike(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get users already followed
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds = following?.map(f => f.following_id) || []
  followingIds.push(userId) // Exclude self

  // Get recent players (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentPlayersData } = await supabase
    .from('recent_players')
    .select('encountered_player_id, last_encountered_at')
    .eq('user_id', userId)
    .gte('last_encountered_at', thirtyDaysAgo.toISOString())

  // Filter out already followed users and self
  const recentPlayers = recentPlayersData?.filter(
    rp => !followingIds.includes(rp.encountered_player_id)
  ) || []

  // Get users with similar games (at least 2 mutual games)
  const { data: userGames } = await supabase
    .from('user_games')
    .select('game_id')
    .eq('user_id', userId)

  if (!userGames || userGames.length === 0) {
    // If user has no games, just return recent players
    if (!recentPlayers || recentPlayers.length === 0) return []
    
    const recentPlayerIds = Array.from(new Set(recentPlayers.map(rp => rp.encountered_player_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, plan_tier, plan_expires_at')
      .in('id', recentPlayerIds)
      .limit(8)

    return profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      mutual_games: 0,
      suggestion_reason: 'recent' as const,
      plan_tier: profile.plan_tier,
      plan_expires_at: profile.plan_expires_at,
    })) || []
  }

  const userGameIds = userGames.map(ug => ug.game_id)

  // Find users with same games
  const { data: similarUsersData } = await supabase
    .from('user_games')
    .select('user_id, game_id')
    .in('game_id', userGameIds)

  // Filter out already followed users and self
  const similarUsers = similarUsersData?.filter(
    su => !followingIds.includes(su.user_id)
  ) || []

  if (!similarUsers || similarUsers.length === 0) {
    // Fallback to recent players only
    if (!recentPlayers || recentPlayers.length === 0) return []
    
    const recentPlayerIds = Array.from(new Set(recentPlayers.map(rp => rp.encountered_player_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, plan_tier, plan_expires_at')
      .in('id', recentPlayerIds)
      .limit(8)

    return profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      mutual_games: 0,
      suggestion_reason: 'recent' as const,
      plan_tier: profile.plan_tier,
      plan_expires_at: profile.plan_expires_at,
    })) || []
  }

  // Count mutual games per user
  const mutualGameCounts: Record<string, number> = {}
  similarUsers.forEach(su => {
    if (su.user_id !== userId) {
      mutualGameCounts[su.user_id] = (mutualGameCounts[su.user_id] || 0) + 1
    }
  })

  // Filter users with at least 2 mutual games
  const usersWithMutualGames = Object.entries(mutualGameCounts)
    .filter(([, count]) => count >= 2)
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)

  // Combine with recent players
  const recentPlayerMap = new Map<string, Date>()
  recentPlayers?.forEach(rp => {
    const existing = recentPlayerMap.get(rp.encountered_player_id)
    if (!existing || new Date(rp.last_encountered_at) > existing) {
      recentPlayerMap.set(rp.encountered_player_id, new Date(rp.last_encountered_at))
    }
  })

  // Get all unique user IDs
  const allUserIds = new Set<string>()
  usersWithMutualGames.forEach(u => allUserIds.add(u.userId))
  recentPlayerMap.forEach((_, userId) => allUserIds.add(userId))

  if (allUserIds.size === 0) return []

  // Fetch profiles
  const userIdsArray = Array.from(allUserIds)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, plan_tier, plan_expires_at')
    .in('id', userIdsArray)
    .limit(8)

  if (!profiles) return []

  // Combine data
  const result = profiles.map(profile => {
    const mutualGames = mutualGameCounts[profile.id] || 0
    const hasRecentEncounter = recentPlayerMap.has(profile.id)
    
    let suggestion_reason: 'both' | 'recent' | 'similar' = 'similar'
    if (hasRecentEncounter && mutualGames >= 2) {
      suggestion_reason = 'both'
    } else if (hasRecentEncounter) {
      suggestion_reason = 'recent'
    }

    return {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      mutual_games: mutualGames,
      suggestion_reason,
      plan_tier: profile.plan_tier,
      plan_expires_at: profile.plan_expires_at,
    }
  })

  // Sort: both > recent/similar, then by mutual games
  result.sort((a, b) => {
    if (a.suggestion_reason === 'both' && b.suggestion_reason !== 'both') return -1
    if (b.suggestion_reason === 'both' && a.suggestion_reason !== 'both') return 1
    return b.mutual_games - a.mutual_games
  })

  return result.slice(0, 8)
}

async function getRecentlyViewedGames(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get unique games the user has searched/viewed in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: searchEvents } = await supabase
    .from('game_search_events')
    .select('game_id, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (!searchEvents || searchEvents.length === 0) return []

  // Get unique game IDs (most recent first)
  const uniqueGameIds = new Map<string, Date>()
  searchEvents.forEach((event) => {
    const existing = uniqueGameIds.get(event.game_id)
    if (!existing || new Date(event.created_at) > existing) {
      uniqueGameIds.set(event.game_id, new Date(event.created_at))
    }
  })

  // Sort by most recent and get top 6
  const sortedGameIds = Array.from(uniqueGameIds.entries())
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .slice(0, 6)
    .map(([gameId]) => gameId)

  return sortedGameIds
}

const getTopGames = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
  
  // Get games with most active lobbies in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Count active lobbies per game
  const { data: activeLobbies } = await supabase
    .from('lobbies')
    .select('game_id, created_at')
    .in('status', ['open', 'in_progress'])
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (!activeLobbies || activeLobbies.length === 0) return []

  // Count lobbies per game
  const lobbyCounts: Record<string, number> = {}
  activeLobbies.forEach((lobby) => {
    lobbyCounts[lobby.game_id] = (lobbyCounts[lobby.game_id] || 0) + 1
  })

  // Get top game IDs from lobbies first (limit to top 20 to avoid fetching all user_games)
  const topLobbyGameIds = Object.entries(lobbyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([gameId]) => gameId)

  // Only count users for games that already have lobbies (much faster)
  const { data: userGames } = await supabase
    .from('user_games')
    .select('game_id')
    .in('game_id', topLobbyGameIds)

  const userCounts: Record<string, number> = {}
  userGames?.forEach((ug) => {
    userCounts[ug.game_id] = (userCounts[ug.game_id] || 0) + 1
  })

  // Combine scores: lobbies count * 2 + user count
  const gameScores: Record<string, number> = {}
  
  topLobbyGameIds.forEach((gameId) => {
    const lobbyScore = (lobbyCounts[gameId] || 0) * 2
    const userScore = userCounts[gameId] || 0
    gameScores[gameId] = lobbyScore + userScore
  })

  // Sort by score and get top 6
  const sortedGames = Object.entries(gameScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([gameId]) => gameId)

  return sortedGames
  },
  ['top-games'],
  { revalidate: 300 } // Cache for 5 minutes
)

const getMostSearchedThisWeek = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
    
    // Get games with most searches in the last 7 days (this week)
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
      .map(([gameId]) => gameId)

    return sorted
  },
  ['most-searched-week'],
  { revalidate: 300 } // Cache for 5 minutes
)

async function getMostSearchedGamesWithData(gameIds: string[]) {
  // Fetch all game data in parallel
  const gamesData = await Promise.all(
    gameIds.map(async (gameId) => {
      try {
        const gameIdNum = parseInt(gameId, 10)
        if (isNaN(gameIdNum)) {
          return { gameId, name: 'Unknown Game', logoUrl: null }
        }

        const game = await getGameById(gameIdNum)
        if (!game) {
          return { gameId, name: 'Unknown Game', logoUrl: null }
        }

        const logoUrl = game.logoThumb || game.logoUrl || null
        return { gameId, name: game.name, logoUrl }
      } catch (error) {
        console.error('Error fetching game:', gameId, error)
        return { gameId, name: 'Unknown Game', logoUrl: null }
      }
    })
  )

  return gamesData
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has completed onboarding (has games in library)
  if (user) {
    const { data: userGames } = await supabase
      .from('user_games')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    // If no games found, redirect to onboarding
    if (!userGames || userGames.length === 0) {
      redirect('/onboarding')
    }
  }

  // Fetch most searched once and reuse
  const mostSearchedThisWeek = await getMostSearchedThisWeek()
  const mostSearchedGamesData = await getMostSearchedGamesWithData(mostSearchedThisWeek)

  const [trendingGames, recentLobbies, upcomingEvents, suggestedPeople, recentlyViewedGames] = await Promise.all([
    getTrendingGames(),
    getRecentLobbies(),
    getUpcomingEvents(),
    user ? getPeopleYouMightLike(user.id) : Promise.resolve([]),
    user ? getRecentlyViewedGames(user.id) : Promise.resolve([]),
  ])

  // Batch fetch all game data in parallel for better performance
  const gameDataPromises: Array<Promise<{ key: string; game: any }>> = []
  
  // Featured game
  if (trendingGames.length > 0) {
    const gameId = parseInt(trendingGames[0].gameId, 10)
    if (!isNaN(gameId)) {
      gameDataPromises.push(
        getGameById(gameId)
          .then(game => ({ key: `featured_${gameId}`, game }))
          .catch(() => ({ key: `featured_${gameId}`, game: null }))
      )
    }
  }
  
  // Recent lobbies covers
  if (recentLobbies.length > 0) {
    recentLobbies.slice(0, 4).forEach((lobby) => {
      const gameIdNum = parseInt(lobby.game_id, 10)
      if (!isNaN(gameIdNum)) {
        gameDataPromises.push(
          getGameById(gameIdNum)
            .then(game => ({ key: `lobby_${lobby.id}`, game }))
            .catch(() => ({ key: `lobby_${lobby.id}`, game: null }))
        )
      }
    })
  }

  // Trending games
  trendingGames.forEach(({ gameId }) => {
    const gameIdNum = parseInt(gameId, 10)
    if (!isNaN(gameIdNum)) {
      gameDataPromises.push(
        getGameById(gameIdNum)
          .then(game => ({ key: `trending_${gameId}`, game }))
          .catch(() => ({ key: `trending_${gameId}`, game: null }))
      )
    }
  })

  // Recently viewed games
  if (user && recentlyViewedGames.length > 0) {
    recentlyViewedGames.forEach((gameId) => {
      const gameIdNum = parseInt(gameId, 10)
      if (!isNaN(gameIdNum)) {
        gameDataPromises.push(
          getGameById(gameIdNum)
            .then(game => ({ key: `recent_${gameId}`, game }))
            .catch(() => ({ key: `recent_${gameId}`, game: null }))
        )
      }
    })
  }

  // Upcoming events
  upcomingEvents.forEach(({ event }) => {
    const gameIdNum = parseInt(event.game_id, 10)
    if (!isNaN(gameIdNum)) {
      gameDataPromises.push(
        getGameById(gameIdNum)
          .then(game => ({ key: `event_${event.id}`, game }))
          .catch(() => ({ key: `event_${event.id}`, game: null }))
      )
    }
  })

  // Fetch all game data in parallel and build map
  const gameDataResults = await Promise.all(gameDataPromises)
  const gameDataMap = new Map<string, any>()
  gameDataResults.forEach(({ key, game }) => {
    gameDataMap.set(key, game)
  })
  
  // Process featured game
  let featuredGame = null
  if (trendingGames.length > 0) {
    const gameId = parseInt(trendingGames[0].gameId, 10)
    const featuredGameData = gameDataMap.get(`featured_${gameId}`)
    if (featuredGameData) {
      featuredGame = {
        id: gameId,
        name: featuredGameData.name,
        coverUrl: featuredGameData.coverUrl || null,
      }
    }
  }
  
  // Fallback to Counter-Strike if no trending game found
  if (!featuredGame) {
    try {
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

  // Process recent lobbies with covers
  const recentLobbiesWithCovers = recentLobbies.map((lobby) => {
    const lobbyGameData = gameDataMap.get(`lobby_${lobby.id}`)
    const coverUrl = lobbyGameData 
      ? (lobbyGameData.squareCoverThumb || lobbyGameData.squareCoverUrl || null)
      : null
    return {
      ...lobby,
      coverUrl,
    }
  })

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/og-image.png`,
        },
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
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
                    <StartMatchmakingButton />
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
              {trendingGames.map(({ gameId }) => {
                const gameData = gameDataMap.get(`trending_${gameId}`)
                return (
                  <TrendingGameCard 
                    key={gameId} 
                    gameId={gameId}
                    gameData={gameData?.game}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Most Searched This Week */}
      {mostSearchedThisWeek.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MostSearchedCarousel gameIds={mostSearchedThisWeek} gamesData={mostSearchedGamesData} />
          </div>
        </section>
      )}

      {/* Recently Viewed Games */}
      {user && recentlyViewedGames.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-title text-white flex items-center gap-2">
                <History className="w-6 h-6 text-cyan-400" />
                Recently Viewed Games
              </h2>
            </div>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {recentlyViewedGames.map((gameId) => {
                const gameData = gameDataMap.get(`recent_${gameId}`)
                return (
                  <RecentlyViewedGameCardWrapper 
                    key={gameId} 
                    gameId={gameId}
                    gameData={gameData?.game}
                  />
                )
              })}
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
                const gameData = gameDataMap.get(`event_${event.id}`)
                return (
                  <EventCardWithCover
                    key={event.id}
                    event={event}
                    participantCount={participantCount}
                    gameData={gameData?.game}
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

      {/* People You Might Like */}
      {user && suggestedPeople.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-title text-white flex items-center gap-2">
                <People className="w-6 h-6 text-cyan-400" />
                People You Might Like
              </h2>
              <Link
                href="/recent-players"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedPeople.map((person) => (
                <PeopleYouMightLikeCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        </section>
      )}

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
    </>
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
  gameData,
}: {
  event: any
  participantCount: number
  gameData?: any
}) {
  // Use pre-fetched game data if available
  let heroCoverUrl = null
  let squareIconUrl = null
  
  if (gameData) {
    heroCoverUrl = gameData.coverUrl || gameData.coverThumb || null
    squareIconUrl = gameData.squareCoverUrl || gameData.squareCoverThumb || null
  } else {
    // Fallback to fetching if not pre-fetched
    try {
      const gameIdNum = parseInt(event.game_id, 10)
      if (!isNaN(gameIdNum)) {
        const game = await getGameById(gameIdNum)
        if (game) {
          heroCoverUrl = game.coverUrl || game.coverThumb || null
          squareIconUrl = game.squareCoverUrl || game.squareCoverThumb || null
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return <EventCard event={event} heroCoverUrl={heroCoverUrl} squareIconUrl={squareIconUrl} participantCount={participantCount} />
}

async function TrendingGameCard({ gameId, gameData }: { gameId: string; gameData?: any }) {
  // Use pre-fetched game data if available
  if (gameData) {
    return <GameCard id={gameId} name={gameData.name} coverUrl={gameData.coverThumb || gameData.coverUrl} />
  }

  // Fallback to fetching if not pre-fetched
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

async function RecentlyViewedGameCardWrapper({ gameId, gameData }: { gameId: string; gameData?: any }) {
  // Use pre-fetched game data if available
  if (gameData) {
    const coverUrl = gameData.squareCoverThumb || gameData.squareCoverUrl || gameData.coverThumb || gameData.coverUrl
    return <RecentlyViewedGameCard id={gameId} name={gameData.name} coverUrl={coverUrl} />
  }

  // Fallback to fetching if not pre-fetched
  try {
    const gameIdNum = parseInt(gameId, 10)
    if (isNaN(gameIdNum)) {
      return <RecentlyViewedGameCard id={gameId} name="Unknown Game" />
    }

    const game = await getGameById(gameIdNum)

    if (!game) {
      return <RecentlyViewedGameCard id={gameId} name="Unknown Game" />
    }

    // Use square cover for better color extraction
    const coverUrl = game.squareCoverThumb || game.squareCoverUrl || game.coverThumb || game.coverUrl

    return <RecentlyViewedGameCard id={gameId} name={game.name} coverUrl={coverUrl} />
  } catch (error) {
    console.error('Error fetching recently viewed game:', gameId, error)
    return <RecentlyViewedGameCard id={gameId} name="Unknown Game" />
  }
}

async function MostSearchedGameCard({ gameId }: { gameId: string }) {
  // Fetch game details with logo
  try {
    const gameIdNum = parseInt(gameId, 10)
    if (isNaN(gameIdNum)) {
      return <GameLogoCard id={gameId} name="Unknown Game" />
    }

    const game = await getGameById(gameIdNum)

    if (!game) {
      return <GameLogoCard id={gameId} name="Unknown Game" />
    }

    // Use logo from SteamGridDB (not icon)
    const logoUrl = game.logoThumb || game.logoUrl || null

    return <GameLogoCard id={gameId} name={game.name} logoUrl={logoUrl} />
  } catch (error) {
    console.error('Error fetching most searched game:', gameId, error)
    return <GameLogoCard id={gameId} name="Unknown Game" />
  }
}


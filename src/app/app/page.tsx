import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { siteUrl, siteName } from '@/lib/seo/site'
import { generateWebSiteJsonLd, generateOrganizationJsonLd } from '@/lib/seo/jsonld'

export const metadata: Metadata = {
  title: {
    absolute: 'Apoxer.com - Discover & play games with new players',
  },
  description: 'Apoxer.com is a gaming matchmaking platform intended for both game players and gaming communities. Browse active game lobbies, find players, discover new games, and connect with thousands of gamers worldwide.',
  alternates: {
    canonical: 'https://apoxer.com/',
  },
  openGraph: {
    title: 'Apoxer.com - Discover & play games with new players',
    description: 'Apoxer.com is a gaming matchmaking platform intended for both game players and gaming communities. Browse active game lobbies, find players, discover new games, and connect with thousands of gamers worldwide.',
    url: 'https://apoxer.com/',
    siteName: 'Apoxer.com',
    type: 'website',
  },
  twitter: {
    title: 'Apoxer.com - Discover & play games with new players',
    description: 'Apoxer.com is a gaming matchmaking platform intended for both game players and gaming communities. Browse active game lobbies, find players, discover new games, and connect with thousands of gamers worldwide.',
    card: 'summary_large_image',
  },
}
import { LobbyCard } from '@/components/LobbyCard'
import { RecentLobbyCard } from '@/components/RecentLobbyCard'
import { GameCard } from '@/components/GameCard'
import { GameLogoCard } from '@/components/GameLogoCard'
import { EventCard } from '@/components/EventCard'
import { EventsCarousel } from '@/components/EventsCarousel'
import { StartMatchmakingButton } from '@/components/StartMatchmakingButton'
import { PeopleYouMightLikeCard } from '@/components/PeopleYouMightLikeCard'
import { RecentlyViewedGameCard } from '@/components/RecentlyViewedGameCard'
import { MostSearchedCarousel } from '@/components/MostSearchedCarousel'
import { CommunityVotesHeroClient } from '@/components/CommunityVotesHeroClient'
import { TournamentCard } from '@/components/TournamentCard'
import { createServerSupabaseClient, createPublicSupabaseClient } from '@/lib/supabase/server'
import { getGameById } from '@/lib/steamgriddb'
import { generateSlug } from '@/lib/slug'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import People from '@mui/icons-material/People'
import TrendingUp from '@mui/icons-material/TrendingUp'
import EventIcon from '@mui/icons-material/Event'
import History from '@mui/icons-material/History'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import { AboutDrawer } from '@/components/AboutDrawer'
import { LiveActivityIndicator } from '@/components/LiveActivityIndicator'
import { MatchmakingSearchBar } from '@/components/MatchmakingSearchBar'
import { PopularGameCard } from '@/components/PopularGameCard'
import { TrendingGameCard as TrendingGameCardComponent } from '@/components/TrendingGameCard'
import { PurpleMatchmakingButton } from '@/components/PurpleMatchmakingButton'
import { HorizontalGameCard } from '@/components/HorizontalGameCard'

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

const getHeroStats = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    // Get active lobbies count
    const { count: activeLobbiesCount } = await supabase
      .from('lobbies')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])

    // Get total unique games in user libraries (distinct game_id count)
    const { data: uniqueGames } = await supabase
      .from('user_games')
      .select('game_id')
    
    const uniqueGameIds = new Set(uniqueGames?.map(ug => ug.game_id) || [])
    const totalGamesCount = uniqueGameIds.size

    // Get active users (users active in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: activeUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', sevenDaysAgo.toISOString())

    return {
      activeLobbies: activeLobbiesCount || 0,
      totalGames: totalGamesCount || 0,
      activeUsers: activeUsersCount || 0,
    }
  },
  ['hero-stats'],
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

    return data.map((lobby) => {
      // Transform host from array to single object if needed
      const hostArray = lobby.host as any
      const host = Array.isArray(hostArray) ? (hostArray[0] || null) : (hostArray || null)
      
      return {
        ...lobby,
        host: host ? {
          username: host.username,
          avatar_url: host.avatar_url,
        } : null,
        member_count: counts[lobby.id] || 1,
      }
    })
  },
  ['recent-lobbies'],
  { revalidate: 60 } // Cache for 1 minute (lobbies change frequently)
)

const getGamesWithRecentLobbies = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    // Get all lobbies from the last 30 days (any status) to find games with recent activity
    // This ensures games persist even after their lobbies are closed
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabase
      .from('lobbies')
      .select('game_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500) // Get more lobbies to ensure we have good game diversity

    if (!data || data.length === 0) return []

    // Group by game_id and get the most recent created_at for each game
    // This allows games to persist and get updated when new lobbies are created
    const gameMap = new Map<string, Date>()
    data.forEach((lobby) => {
      const existing = gameMap.get(lobby.game_id)
      if (!existing || new Date(lobby.created_at) > existing) {
        gameMap.set(lobby.game_id, new Date(lobby.created_at))
      }
    })

    // Sort by most recent lobby creation and get top 8 unique games
    // Games will stay in the list for up to 30 days and get repositioned when new lobbies are created
    const sortedGameIds = Array.from(gameMap.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .slice(0, 8)
      .map(([gameId]) => gameId)

    // Get stats for each game (total players, online players, lobbies count, search count)
    const gamesWithStats = await Promise.all(
      sortedGameIds.map(async (gameId) => {
        // Get total players (users with this game)
        const { data: userGames } = await supabase
          .from('user_games')
          .select('user_id')
          .eq('game_id', gameId)

        const totalPlayers = userGames?.length || 0

        // Get online players (active in last 7 days with this game)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const userIds = userGames?.map(u => u.user_id) || []
        const { count: onlinePlayersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('id', userIds)
          .gte('last_active_at', sevenDaysAgo.toISOString())

        // Get active lobbies count
        const { count: lobbiesCount } = await supabase
          .from('lobbies')
          .select('*', { count: 'exact', head: true })
          .eq('game_id', gameId)
          .in('status', ['open', 'in_progress'])

        // Get search count (last 7 days)
        const { count: searchCount } = await supabase
          .from('game_search_events')
          .select('*', { count: 'exact', head: true })
          .eq('game_id', gameId)
          .gte('created_at', sevenDaysAgo.toISOString())

        return {
          gameId,
          totalPlayers,
          onlinePlayers: onlinePlayersCount || 0,
          lobbiesCount: lobbiesCount || 0,
          searchCount: searchCount || 0,
        }
      })
    )

    return gamesWithStats
  },
  ['games-with-recent-lobbies'],
  { revalidate: 60 } // Cache for 1 minute (lobbies change frequently, but games persist)
)

const getTournaments = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
    
    // Get recent tournaments (upcoming, live, or recently completed)
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select(`
        *,
        host:profiles!tournaments_host_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .in('status', ['open', 'registration_closed', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(6)

    return tournaments || []
  },
  ['home-tournaments'],
  { revalidate: 120 } // Cache for 2 minutes
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
      .select('id, username, display_name, avatar_url, bio, banner_url, plan_tier, plan_expires_at')
      .in('id', recentPlayerIds)
      .limit(8)

    return profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || null,
      avatar_url: profile.avatar_url,
      bio: profile.bio || null,
      mutual_games: 0,
      mutual_games_data: [],
      banner_cover_url: null,
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
      .select('id, username, display_name, avatar_url, bio, banner_url, plan_tier, plan_expires_at')
      .in('id', recentPlayerIds)
      .limit(8)

    return profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || null,
      avatar_url: profile.avatar_url,
      bio: profile.bio || null,
      mutual_games: 0,
      mutual_games_data: [],
      banner_cover_url: null,
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

  // Fetch profiles with bio, banner_url, and display_name
  const userIdsArray = Array.from(allUserIds)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, banner_url, plan_tier, plan_expires_at')
    .in('id', userIdsArray)
    .limit(8)

  if (!profiles) return []

  // Get mutual game IDs for each user (for fetching game covers)
  const mutualGameIdsMap: Record<string, string[]> = {}
  profiles.forEach(profile => {
    const userMutualGames = similarUsers
      .filter(su => su.user_id === profile.id)
      .map(su => su.game_id)
      .filter(id => id != null) as string[]
    
    // Get unique game IDs (limit to 5 for display)
    mutualGameIdsMap[profile.id] = Array.from(new Set(userMutualGames)).slice(0, 5)
  })

  // Fetch game data for all mutual games
  const allMutualGameIds = Array.from(new Set(
    Object.values(mutualGameIdsMap).flat()
  ))
  
  const gameDataMap = new Map<string, any>()
  if (allMutualGameIds.length > 0) {
    await Promise.all(
      allMutualGameIds.map(async (gameId) => {
        try {
          const gameIdNum = parseInt(gameId, 10)
          if (!isNaN(gameIdNum)) {
            const game = await getGameById(gameIdNum)
            if (game) {
              gameDataMap.set(gameId, game)
            }
          }
        } catch (error) {
          // Silently fail for individual games
        }
      })
    )
  }

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

    // Get mutual game data for this user
    const userMutualGameIds = mutualGameIdsMap[profile.id] || []
    const mutualGamesData = userMutualGameIds.map(gameId => {
      const game = gameDataMap.get(gameId)
      if (!game) return null
      
      return {
        gameId,
        gameName: game.name,
        squareIconUrl: game.squareCoverThumb || game.squareCoverUrl || null,
        bannerCoverUrl: game.coverUrl || game.coverThumb || game.horizontalCoverUrl || game.horizontalCoverThumb || null,
      }
    }).filter(Boolean) as Array<{
      gameId: string
      gameName: string
      squareIconUrl: string | null
      bannerCoverUrl: string | null
    }>

    // Use profile banner_url only (don't fall back to game banner - user wants profile cover specifically)
    const bannerCover = profile.banner_url || null

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || null,
      avatar_url: profile.avatar_url,
      bio: profile.bio || null,
      mutual_games: mutualGames,
      mutual_games_data: mutualGamesData,
      banner_cover_url: bannerCover,
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

const getPopularGamesWithStats = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
    
    // Get top 6 games (same logic as getTopGames)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activeLobbies } = await supabase
      .from('lobbies')
      .select('game_id, created_at')
      .in('status', ['open', 'in_progress'])
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (!activeLobbies || activeLobbies.length === 0) return []

    const lobbyCounts: Record<string, number> = {}
    activeLobbies.forEach((lobby) => {
      lobbyCounts[lobby.game_id] = (lobbyCounts[lobby.game_id] || 0) + 1
    })

    const topLobbyGameIds = Object.entries(lobbyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([gameId]) => gameId)

    const { data: userGames } = await supabase
      .from('user_games')
      .select('game_id')
      .in('game_id', topLobbyGameIds)

    const userCounts: Record<string, number> = {}
    userGames?.forEach((ug) => {
      userCounts[ug.game_id] = (userCounts[ug.game_id] || 0) + 1
    })

    const gameScores: Record<string, number> = {}
    topLobbyGameIds.forEach((gameId) => {
      const lobbyScore = (lobbyCounts[gameId] || 0) * 2
      const userScore = userCounts[gameId] || 0
      gameScores[gameId] = lobbyScore + userScore
    })

    const topGameIds = Object.entries(gameScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([gameId]) => gameId)

    // Get stats for each game
    const gamesWithStats = await Promise.all(
      topGameIds.map(async (gameId) => {
        // Get total players (users with this game)
        const totalPlayers = userCounts[gameId] || 0

        // Get online players (active in last 7 days with this game)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { data: activeUsers } = await supabase
          .from('user_games')
          .select('user_id')
          .eq('game_id', gameId)

        const userIds = activeUsers?.map(u => u.user_id) || []
        const { count: onlinePlayersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('id', userIds)
          .gte('last_active_at', sevenDaysAgo.toISOString())

        // Get 3 recent lobbies
        const { data: lobbies } = await supabase
          .from('lobbies')
          .select(`
            id,
            title,
            created_at,
            max_players,
            host:profiles!lobbies_host_id_fkey(username, avatar_url)
          `)
          .eq('game_id', gameId)
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(3)

        // Get member counts for lobbies
        const lobbyIds = lobbies?.map(l => l.id) || []
        const { data: memberCounts } = await supabase
          .from('lobby_members')
          .select('lobby_id')
          .in('lobby_id', lobbyIds)

        const counts: Record<string, number> = {}
        memberCounts?.forEach(m => {
          counts[m.lobby_id] = (counts[m.lobby_id] || 0) + 1
        })

        const lobbiesWithCounts = lobbies?.map(lobby => {
          // Transform host from array to single object if needed
          const hostArray = lobby.host as any
          const host = Array.isArray(hostArray) ? (hostArray[0] || null) : (hostArray || null)
          
          return {
            id: lobby.id,
            title: lobby.title,
            created_at: lobby.created_at,
            max_players: lobby.max_players,
            host: host ? {
              username: host.username,
              avatar_url: host.avatar_url,
            } : null,
            member_count: counts[lobby.id] || 1,
          }
        }) || []

        return {
          gameId,
          totalPlayers,
          onlinePlayers: onlinePlayersCount || 0,
          activeLobbies: lobbyCounts[gameId] || 0,
          lobbies: lobbiesWithCounts,
        }
      })
    )

    return gamesWithStats
  },
  ['popular-games-with-stats'],
  { revalidate: 60 } // Cache for 1 minute
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

  // Allow unauthenticated users to access /app as the default page

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

  // Fetch community vote data and hero stats in parallel with other data
  const [trendingGames, recentLobbies, upcomingEvents, suggestedPeople, recentlyViewedGames, tournaments, heroStats, popularGamesWithStats, communityVoteData, gamesWithRecentLobbies] = await Promise.all([
    getTrendingGames(),
    getRecentLobbies(),
    getUpcomingEvents(),
    user ? getPeopleYouMightLike(user.id) : Promise.resolve([]),
    user ? getRecentlyViewedGames(user.id) : Promise.resolve([]),
    getTournaments(),
    getHeroStats(),
    getPopularGamesWithStats(),
    (async () => {
      try {
        // Get the current active round (only 'open' rounds)
        const { data: currentRound } = await supabase
          .from('weekly_rounds')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!currentRound) {
          return null
        }

        // Get candidates for this round
        const { data: candidates } = await supabase
          .from('weekly_game_candidates')
          .select('*')
          .eq('round_id', currentRound.id)

        if (!candidates || candidates.length === 0) {
          return null
        }

        // Get vote counts for each candidate (single query)
        const candidateIds = candidates.map(c => c.id)
        const voteCounts: Record<string, number> = {}

        if (candidateIds.length > 0) {
          const { data: votes } = await supabase
            .from('weekly_game_votes')
            .select('candidate_id')
            .in('candidate_id', candidateIds)

          votes?.forEach(vote => {
            voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1
          })
        }

        // Attach vote counts to candidates and filter/sort
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const candidatesWithVotes = candidates
          .map(candidate => ({
            ...candidate,
            total_votes: voteCounts[candidate.id] || 0,
          }))
          .filter(candidate => {
            return candidate.total_votes > 0 || new Date(candidate.created_at) > new Date(fiveMinutesAgo)
          })
          .sort((a, b) => b.total_votes - a.total_votes)
          .slice(0, 5) // Limit to top 5 for home page

        if (candidatesWithVotes.length === 0) {
          return null
        }

        // Get user votes if authenticated
        const userVotes: Record<string, boolean> = {}

        if (user && candidateIds.length > 0) {
          const { data: votes } = await supabase
            .from('weekly_game_votes')
            .select('candidate_id')
            .eq('round_id', currentRound.id)
            .eq('user_id', user.id)
            .in('candidate_id', candidateIds)

          votes?.forEach(vote => {
            userVotes[vote.candidate_id] = true
          })
        }

        return {
          round: currentRound,
          candidates: candidatesWithVotes,
          userVotes,
        }
      } catch (error) {
        console.error('Error fetching community vote data:', error)
        return null
      }
    })(),
    getGamesWithRecentLobbies(),
  ])

  // Fetch game data for popular games
  const popularGamesData = await Promise.all(
    popularGamesWithStats.map(async (gameStats) => {
      const gameIdNum = parseInt(gameStats.gameId, 10)
      if (isNaN(gameIdNum)) return null
      
      try {
        const game = await getGameById(gameIdNum)
        if (!game) return null

        return {
          gameStats,
          game: {
            name: game.name,
            coverUrl: game.coverThumb || game.coverUrl || null,
          },
        }
      } catch {
        return null
      }
    })
  )

  // Filter out nulls
  const validPopularGames = popularGamesData.filter(
    (item): item is { gameStats: typeof popularGamesWithStats[0]; game: { name: string; coverUrl: string | null } } => item !== null
  )

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

  // Games with recent lobbies
  if (gamesWithRecentLobbies.length > 0) {
    gamesWithRecentLobbies.forEach((game) => {
      const gameIdNum = parseInt(game.gameId, 10)
      if (!isNaN(gameIdNum)) {
        gameDataPromises.push(
          getGameById(gameIdNum)
            .then(gameData => ({ key: `recent_lobby_game_${game.gameId}`, game: gameData }))
            .catch(() => ({ key: `recent_lobby_game_${game.gameId}`, game: null }))
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
    gameDataMap.set(key, game) // Store game directly
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

  // Get unique games from recent lobbies for games section
  const recentLobbiesGameIds = Array.from(new Set(recentLobbies.map(lobby => lobby.game_id)))
  const recentLobbiesGames = recentLobbiesGameIds
    .map(gameId => {
      const lobby = recentLobbies.find(l => l.game_id === gameId)
      const gameData = lobby ? gameDataMap.get(`lobby_${lobby.id}`) : null
      return gameData ? {
        id: parseInt(gameId, 10),
        name: gameData.name,
        coverUrl: gameData.coverThumb || gameData.coverUrl || null,
      } : null
    })
    .filter((game): game is { id: number; name: string; coverUrl: string | null } => game !== null)
    .slice(0, 8) // Limit to 8 games

  // JSON-LD structured data
  // Enhanced JSON-LD structured data for rich search results (similar to IGDB.com)
  const websiteJsonLd = generateWebSiteJsonLd()
  const organizationJsonLd = generateOrganizationJsonLd()
  
  const jsonLd = [
    websiteJsonLd,
    organizationJsonLd,
  ]

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="min-h-screen pt-4 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    

        {/* Hero Section */}
 

        {/* Full-width Matchmaking Search Section 
        <div className="w-full bg-slate-900/50 border-y border-slate-700/50 py-4">
          <MatchmakingSearchBar />
        </div>*/}

       {/* {recentLobbies.length > 0 && (
          <section className="mb-8 flex gap-4">
            <RecentLobbiesScroll lobbies={recentLobbiesWithCovers} />       <RecentLobbiesScroll lobbies={recentLobbiesWithCovers} />       <RecentLobbiesScroll lobbies={recentLobbiesWithCovers} />
          </section>
        )}*/}

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="relative mb-4 lg:mb-8 overflow-visible">
    <div className="lg:hidden flex items-center gap-2 px-4 sm:px-6 mb-4">
      <img src="/logo.png" alt="Apoxer" className="h-5 w-5" />
      <span className="text-xl font-title font-bold text-white">Apoxer</span>
    </div>

    <section
      className="relative"
      style={{
        background:
          "linear-gradient(0deg, rgb(47, 59, 82) 0%, rgb(22, 32, 50) 70%, rgb(22, 32, 50) 100%)",
      }}
    >
      <div className="relative px-6 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-12 flex items-center min-h-[200px] lg:min-h-[450px]">
        {/* TEXT AREA */}
        <div className="z-10 flex flex-col justify-center text-left">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-title text-white mb-0">
            APOXER
          </h2>

          {/* Slogan */}
          <h2 className="text-lg sm:text-xl lg:text-xl font-title font-bold text-cyan-400 mb-8">
            [ FIND NEW PLAYERS, THE EASY WAY ]
          </h2>

          {/* Feature bullets */}
          <div className="space-y-0 mb-10">
            {[
              "Create and join lobbies for your favorite games.",
              "Access Discords, Mumbles, and all game communities in one place.",
              "Customize your profile and discover new players.",
              "Create and join events and tournaments.",
              "Revive old games through weekly community votes.",
            ].map((text) => (
              <p
                key={text}
                className="text-sm sm:text-base lg:text-md text-white flex items-start gap-3"
              >
                <span className="mt-2 w-1.5 h-1.5 bg-white flex-shrink-0" />
                {text}
              </p>
            ))}
          </div>

          {/* CTA */}
          <div className="w-full max-w-4xl">
            <button className="relative px-6 py-4 bg-[#ed3515] text-white hover:bg-[#E24428] active:bg-[#C53A22] font-title text-base transition-colors duration-200 whitespace-nowrap">
              <span className="absolute top-[-1px] left-[-1px] w-5 h-5 border-t border-l border-slate-900" />
              <span className="absolute top-[-1px] right-[-1px] w-5 h-5 border-t border-r border-slate-900" />
              <span className="absolute bottom-[-1px] left-[-1px] w-5 h-5 border-b border-l border-slate-900" />
              <span className="absolute bottom-[-1px] right-[-1px] w-5 h-5 border-b border-r border-slate-900" />
              <span className="relative z-10">{"> START MATCHMAKING"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    {/* Hero character */}
    <img
      src="https://iili.io/f5dUyv9.png"
      alt="Hero character"
      className="absolute bottom-0 right-0 w-32 lg:w-auto lg:h-auto mt-10 lg:mt-0"
    />
  </div>
</div>

      {/* How Apoxer Works Section */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-title text-white mb-8 lg:mb-12 text-center">
            How Apoxer works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-cyan-400">1</span>
              </div>
              <h3 className="text-xl font-title text-white mb-2">Search or Browse</h3>
              <p className="text-slate-400">
                Find games or browse active lobbies. Filter by platform, region, and game type.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-cyan-400">2</span>
              </div>
              <h3 className="text-xl font-title text-white mb-2">Join or Create</h3>
              <p className="text-slate-400">
                Join an existing lobby or create your own. Match with players based on skill, region, and playstyle.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-cyan-400">3</span>
              </div>
              <h3 className="text-xl font-title text-white mb-2">Start Playing</h3>
              <p className="text-slate-400">
                Coordinate with your team through lobby chat and start playing together in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Popular Games Section - Hidden for later */}
      {false && validPopularGames.length > 0 && (
        <section className="py-8 lg:py-12 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-title text-white mb-6 lg:mb-8">
              Popular Games
            </h2>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {validPopularGames.map(({ gameStats, game }) => (
                <PopularGameCard
                  key={gameStats.gameId}
                  gameId={gameStats.gameId}
                  gameName={game.name}
                  gameCoverUrl={game.coverUrl}
                  totalPlayers={gameStats.totalPlayers}
                  onlinePlayers={gameStats.onlinePlayers}
                  activeLobbies={gameStats.activeLobbies}
                  lobbies={gameStats.lobbies}
                />
              ))}
            </div>
          </div>
        </section>
      )}



 

      {/* Games from Recent Lobbies - Hidden */}
      {false && recentLobbiesGames.length > 0 && (
        <section className="py-4 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-2xl font-title text-white">
                Games from Recent Lobbies
              </h2>
              <Link
                href="/games"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                All Games
              </Link>
            </div>
            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex gap-4 w-max">
                {recentLobbiesGames.map((game) => (
                  <div key={game.id} className="w-[140px] flex-shrink-0">
                    <GameCard
                      id={generateSlug(game.name)}
                      name={game.name}
                      coverUrl={game.coverUrl}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: Grid */}
            <div className="hidden lg:grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {recentLobbiesGames.map((game) => (
                <GameCard
                  key={game.id}
                  id={generateSlug(game.name)}
                  name={game.name}
                  coverUrl={game.coverUrl}
                />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Active Lobbies - Hidden for later */}
      {false && recentLobbies.length > 0 && (
        <section className="py-4 lg:py-12 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-2xl font-title text-white">
                Active Lobbies
              </h2>
              <Link
                href="/games"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                All
              </Link>
            </div>
            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex gap-4 w-max">
                {recentLobbies.map((lobby) => (
                  <div key={lobby.id} className="w-[280px] sm:w-[320px] flex-shrink-0">
                    <LobbyCard lobby={lobby} />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: Grid */}
            <div className="hidden lg:grid gap-4 grid-cols-4">
              {recentLobbies.map((lobby) => (
                <LobbyCard key={lobby.id} lobby={lobby} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Games with Recent Lobbies */}
      {gamesWithRecentLobbies.length > 0 && (
        <section className="py-8 lg:py-12 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <h2 className="text-2xl lg:text-3xl font-title text-white">
                Games with Recent Lobbies
              </h2>
              <Link
                href="/games"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                All Games
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {gamesWithRecentLobbies.map((game) => {
                const gameData = gameDataMap.get(`recent_lobby_game_${game.gameId}`)
                if (!gameData) return null
                return (
                  <HorizontalGameCard
                    key={game.gameId}
                    gameId={game.gameId}
                    gameName={gameData.name}
                    gameCoverUrl={gameData.coverThumb || gameData.coverUrl || null}
                    totalPlayers={game.totalPlayers}
                    onlinePlayers={game.onlinePlayers}
                    searchCount={game.searchCount}
                    lobbiesCount={game.lobbiesCount}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Players Like You */}
      {user && suggestedPeople.length > 0 && (
        <section className="py-4 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-2xl font-title text-white">
                Players Like You
              </h2>
              <Link
                href="/recent-players"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                All
              </Link>
            </div>
            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="flex gap-4 w-max">
                {suggestedPeople.map((person) => (
                  <div key={person.id} className="w-[280px] sm:w-[320px] flex-shrink-0">
                    <PeopleYouMightLikeCard person={person} />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: Grid */}
            <div className="hidden lg:grid gap-4 grid-cols-3">
              {suggestedPeople.map((person) => (
                <PeopleYouMightLikeCard key={person.id} person={person} />
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


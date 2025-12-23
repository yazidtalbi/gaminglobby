import { unstable_cache } from 'next/cache'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { demoLobbies, demoPlayers, demoGames, type DemoLobbyItem, type DemoPlayerItem, type DemoGameItem } from './demoActivity'

export interface LobbyItem {
  id: string
  title: string
  game_name: string
  platform: string | null
  region: string | null
  players: string
  recency: string
  is_demo?: boolean
}

export interface PlayerItem {
  id: string
  username: string
  display_name: string | null
  game_name: string
  platform: string | null
  region: string | null
  recency: string
  is_demo?: boolean
}

export interface GameItem {
  id: string
  name: string
  lobbies_count: string
  players_count: string
  recency: string
  is_demo?: boolean
}

export interface ActivityResponse {
  mode: 'live' | 'demo'
  updatedAt: string
  lobbies: LobbyItem[]
  players: PlayerItem[]
  games: GameItem[]
  stats: {
    gamesIndexed: number
    lobbies7d: number
    activePlayers7d: number
  }
}

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

async function getLiveLobbies(): Promise<LobbyItem[]> {
  const supabase = createPublicSupabaseClient()
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const { data: lobbiesData, error } = await supabase
    .from('lobbies')
    .select(`
      id,
      title,
      game_name,
      platform,
      region,
      created_at,
      max_players,
      host:profiles!lobbies_host_id_fkey(username)
    `)
    .in('status', ['open', 'in_progress'])
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(12)

  if (error || !lobbiesData) return []

  // Get member counts
  const lobbyIds = lobbiesData.map(l => l.id)
  const { data: memberCounts } = await supabase
    .from('lobby_members')
    .select('lobby_id')
    .in('lobby_id', lobbyIds)

  const counts: Record<string, number> = {}
  memberCounts?.forEach(m => {
    counts[m.lobby_id] = (counts[m.lobby_id] || 0) + 1
  })

  return lobbiesData.map((lobby: any) => ({
    id: lobby.id,
    title: lobby.title || 'Untitled Lobby',
    game_name: lobby.game_name || 'Unknown Game',
    platform: lobby.platform || null,
    region: lobby.region || null,
    players: `${counts[lobby.id] || 1}/${lobby.max_players || 8}`,
    recency: formatTimeAgo(lobby.created_at),
    is_demo: false,
  }))
}

async function getLivePlayers(): Promise<PlayerItem[]> {
  const supabase = createPublicSupabaseClient()
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  // Get players from recent lobbies - simplified query
  const { data: memberData, error } = await supabase
    .from('lobby_members')
    .select(`
      user_id,
      created_at,
      lobbies(game_name, platform, region),
      profiles(username, display_name, platform, region)
    `)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(12)

  if (error || !memberData) return []

  return memberData
    .filter((member: any) => member.profiles && member.lobbies)
    .map((member: any) => ({
      id: member.user_id,
      username: member.profiles?.username || 'unknown',
      display_name: member.profiles?.display_name || null,
      game_name: (member.lobbies as any)?.game_name || 'Unknown Game',
      platform: (member.lobbies as any)?.platform || member.profiles?.platform || null,
      region: (member.lobbies as any)?.region || member.profiles?.region || null,
      recency: formatTimeAgo(member.created_at),
      is_demo: false,
    }))
}

async function getLiveGames(): Promise<GameItem[]> {
  const supabase = createPublicSupabaseClient()
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const { data: lobbiesData, error } = await supabase
    .from('lobbies')
    .select('game_name, created_at, id')
    .in('status', ['open', 'in_progress'])
    .gte('created_at', twentyFourHoursAgo.toISOString())

  if (error || !lobbiesData) return []

  // Group by game_name
  const gameMap: Record<string, { count: number; latest: string; lobbyIds: string[] }> = {}
  lobbiesData.forEach((lobby: any) => {
    const gameName = lobby.game_name || 'Unknown'
    if (!gameMap[gameName]) {
      gameMap[gameName] = { count: 0, latest: lobby.created_at, lobbyIds: [] }
    }
    gameMap[gameName].count++
    gameMap[gameName].lobbyIds.push(lobby.id)
    if (new Date(lobby.created_at) > new Date(gameMap[gameName].latest)) {
      gameMap[gameName].latest = lobby.created_at
    }
  })

  // Get player counts per game
  const allLobbyIds = Array.from(new Set(Object.values(gameMap).flatMap(g => g.lobbyIds)))
  const { data: memberData } = await supabase
    .from('lobby_members')
    .select('lobby_id')
    .in('lobby_id', allLobbyIds)

  // Map lobby_id to game_name
  const lobbyToGame: Record<string, string> = {}
  lobbiesData.forEach((lobby: any) => {
    lobbyToGame[lobby.id] = lobby.game_name || 'Unknown'
  })

  const playerCounts: Record<string, number> = {}
  memberData?.forEach((member: any) => {
    const gameName = lobbyToGame[member.lobby_id]
    if (gameName) {
      playerCounts[gameName] = (playerCounts[gameName] || 0) + 1
    }
  })

  return Object.entries(gameMap)
    .map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      lobbies_count: String(data.count),
      players_count: String(playerCounts[name] || 0),
      recency: formatTimeAgo(data.latest),
      is_demo: false,
    }))
    .sort((a, b) => parseInt(b.lobbies_count) - parseInt(a.lobbies_count))
    .slice(0, 12)
}

async function getStats() {
  const supabase = createPublicSupabaseClient()

  // Games indexed (unique game_ids in user_games)
  const { data: uniqueGames } = await supabase
    .from('user_games')
    .select('game_id')

  const uniqueGameIds = new Set(uniqueGames?.map(ug => ug.game_id) || [])
  const gamesIndexed = uniqueGameIds.size

  // Lobbies created in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: lobbies7d } = await supabase
    .from('lobbies')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())

  // Active players in last 7 days (distinct users in lobby_members)
  const { data: activeMembers } = await supabase
    .from('lobby_members')
    .select('user_id')
    .gte('created_at', sevenDaysAgo.toISOString())

  const activePlayerIds = new Set(activeMembers?.map(m => m.user_id) || [])
  const activePlayers7d = activePlayerIds.size

  return {
    gamesIndexed,
    lobbies7d: lobbies7d || 0,
    activePlayers7d,
  }
}

export const getActivity = unstable_cache(
  async (): Promise<ActivityResponse> => {
    const [liveLobbies, livePlayers, liveGames, stats] = await Promise.all([
      getLiveLobbies(),
      getLivePlayers(),
      getLiveGames(),
      getStats(),
    ])

    const hasEnoughLiveData = liveLobbies.length >= 6

    if (hasEnoughLiveData) {
      return {
        mode: 'live',
        updatedAt: new Date().toISOString(),
        lobbies: liveLobbies,
        players: livePlayers.length > 0 ? livePlayers : (demoPlayers as PlayerItem[]),
        games: liveGames.length > 0 ? liveGames : (demoGames as GameItem[]),
        stats,
      }
    }

    // Demo mode - use demo data
    return {
      mode: 'demo',
      updatedAt: new Date().toISOString(),
      lobbies: demoLobbies as LobbyItem[],
      players: demoPlayers as PlayerItem[],
      games: demoGames as GameItem[],
      stats,
    }
  },
  ['landing-activity'],
  { revalidate: 120 } // Cache for 2 minutes
)

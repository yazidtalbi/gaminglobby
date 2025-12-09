// SteamGridDB API helper - SERVER ONLY
// This file should only be imported in server components or API routes

const STEAMGRIDDB_API_BASE = process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'
const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY || ''

interface SteamGridDBGame {
  id: number
  name: string
  types: string[]
  verified: boolean
}

interface SteamGridDBGrid {
  id: number
  score: number
  style: string
  width: number
  height: number
  nsfw: boolean
  humor: boolean
  notes: string | null
  mime: string
  language: string
  url: string
  thumb: string
  lock: boolean
  epilepsy: boolean
  upvotes: number
  downvotes: number
  author: {
    name: string
    steam64: string
    avatar: string
  }
}

export interface GameSearchResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
}

export interface GameDetails {
  id: number
  name: string
  coverUrl: string | null
  coverThumb: string | null
}

async function fetchSteamGridDB<T>(endpoint: string): Promise<T | null> {
  if (!STEAMGRIDDB_API_KEY) {
    console.error('SteamGridDB API key not configured')
    return null
  }

  try {
    const response = await fetch(`${STEAMGRIDDB_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${STEAMGRIDDB_API_KEY}`,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error(`SteamGridDB API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.data as T
  } catch (error) {
    console.error('SteamGridDB fetch error:', error)
    return null
  }
}

/**
 * Search for games by name
 */
export async function searchGames(query: string): Promise<GameSearchResult[]> {
  if (!query || query.length < 2) return []

  const games = await fetchSteamGridDB<SteamGridDBGame[]>(`/search/autocomplete/${encodeURIComponent(query)}`)
  
  if (!games || games.length === 0) return []

  // Fetch covers for each game (limited to first 10 for performance)
  const limitedGames = games.slice(0, 10)
  
  const results = await Promise.all(
    limitedGames.map(async (game) => {
      const cover = await getVerticalCover(game.id)
      return {
        id: game.id,
        name: game.name,
        verified: game.verified,
        coverUrl: cover?.thumb || cover?.url || null,
      }
    })
  )

  return results
}

/**
 * Get vertical/portrait grid for a game
 * Prefers grids with height > width (portrait orientation)
 */
export async function getVerticalCover(gameId: number): Promise<{ url: string; thumb: string } | null> {
  // Try to get grids with portrait dimensions
  // SteamGridDB dimensions parameter: 600x900 is a common portrait size
  const grids = await fetchSteamGridDB<SteamGridDBGrid[]>(
    `/grids/game/${gameId}?dimensions=600x900,342x482,660x930`
  )

  if (grids && grids.length > 0) {
    // Find the best portrait grid (height > width)
    const portraitGrid = grids.find(g => g.height > g.width) || grids[0]
    return {
      url: portraitGrid.url,
      thumb: portraitGrid.thumb,
    }
  }

  // Fallback: try any grid and filter for portrait
  const anyGrids = await fetchSteamGridDB<SteamGridDBGrid[]>(`/grids/game/${gameId}`)
  
  if (anyGrids && anyGrids.length > 0) {
    // Sort by portrait orientation (height/width ratio)
    const sorted = anyGrids.sort((a, b) => {
      const ratioA = a.height / a.width
      const ratioB = b.height / b.width
      return ratioB - ratioA // Higher ratio (more portrait) first
    })
    
    return {
      url: sorted[0].url,
      thumb: sorted[0].thumb,
    }
  }

  return null
}

/**
 * Get game details by ID
 */
export async function getGameById(gameId: number): Promise<GameDetails | null> {
  // The /games/id endpoint can return either an array or a single object
  const response = await fetchSteamGridDB<SteamGridDBGame | SteamGridDBGame[]>(`/games/id/${gameId}`)
  
  if (!response) return null

  // Handle both array and single object responses
  const game = Array.isArray(response) ? response[0] : response
  
  if (!game || !game.id) return null

  const cover = await getVerticalCover(gameId)

  return {
    id: game.id,
    name: game.name,
    coverUrl: cover?.url || null,
    coverThumb: cover?.thumb || null,
  }
}


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

interface SteamGridDBIcon {
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

interface SteamGridDBLogo {
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
  squareCoverUrl: string | null
  squareCoverThumb: string | null
  horizontalCoverUrl: string | null
  horizontalCoverThumb: string | null
  iconUrl: string | null
  iconThumb: string | null
  logoUrl: string | null
  logoThumb: string | null
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
      // 400 errors are common when assets don't exist (e.g., no logo, no horizontal cover)
      // Only log unexpected errors (500+) to reduce noise
      if (response.status >= 500) {
        console.error(`SteamGridDB API error: ${response.status} for ${endpoint}`)
      }
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
 * Checks for founder-selected cover first
 */
export async function getVerticalCover(gameId: number): Promise<{ url: string; thumb: string } | null> {
  // First, check if there's a founder-selected cover
  try {
    const { createPublicSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = createPublicSupabaseClient()
    
    const { data: selectedCover } = await supabase
      .from('game_selected_covers')
      .select('selected_cover_url, selected_cover_thumb')
      .eq('game_id', gameId.toString())
      .single()

    if (selectedCover && selectedCover.selected_cover_url) {
      return {
        url: selectedCover.selected_cover_url,
        thumb: selectedCover.selected_cover_thumb,
      }
    }
  } catch (error) {
    // If database check fails, continue with normal flow
    console.error('Error checking selected cover:', error)
  }

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
 * Get square grid/cover for a game (for icons)
 * Prefers square dimensions (512x512, 1024x1024)
 */
export async function getSquareCover(gameId: number): Promise<{ url: string; thumb: string } | null> {
  // Try to get grids with square dimensions
  const grids = await fetchSteamGridDB<SteamGridDBGrid[]>(
    `/grids/game/${gameId}?dimensions=512x512,1024x1024`
  )

  if (grids && grids.length > 0) {
    // Find the best square grid (width === height)
    const squareGrid = grids.find(g => g.width === g.height) || grids[0]
    return {
      url: squareGrid.url,
      thumb: squareGrid.thumb,
    }
  }

  // Fallback: try any grid and filter for square
  const anyGrids = await fetchSteamGridDB<SteamGridDBGrid[]>(`/grids/game/${gameId}`)
  
  if (anyGrids && anyGrids.length > 0) {
    // Sort by squareness (closer to 1:1 ratio is better)
    const sorted = anyGrids.sort((a, b) => {
      const ratioA = Math.abs(1 - (a.width / a.height))
      const ratioB = Math.abs(1 - (b.width / b.height))
      return ratioA - ratioB // Closer to 1:1 is better
    })
    
    return {
      url: sorted[0].url,
      thumb: sorted[0].thumb,
    }
  }

  return null
}

/**
 * Get horizontal/hero cover for a game
 * Prefers wide/landscape grids (width > height)
 */
export async function getHorizontalCover(gameId: number): Promise<{ url: string; thumb: string } | null> {
  // Try to get grids with landscape dimensions
  const grids = await fetchSteamGridDB<SteamGridDBGrid[]>(
    `/grids/game/${gameId}?dimensions=1920x620,1920x1080,1600x900`
  )

  if (grids && grids.length > 0) {
    // Find the best landscape grid (width > height)
    const landscapeGrid = grids.find(g => g.width > g.height) || grids[0]
    return {
      url: landscapeGrid.url,
      thumb: landscapeGrid.thumb,
    }
  }

  // Fallback: try any grid and filter for landscape
  const anyGrids = await fetchSteamGridDB<SteamGridDBGrid[]>(`/grids/game/${gameId}`)
  
  if (anyGrids && anyGrids.length > 0) {
    // Sort by landscape orientation (width/height ratio)
    const sorted = anyGrids.sort((a, b) => {
      const ratioA = a.width / a.height
      const ratioB = b.width / b.height
      return ratioB - ratioA // Higher ratio (more landscape) first
    })
    
    return {
      url: sorted[0].url,
      thumb: sorted[0].thumb,
    }
  }

  return null
}

/**
 * Get icon for a game
 * Icons are typically square (e.g., 256x256, 512x512)
 */
export async function getGameIcon(gameId: number): Promise<{ url: string; thumb: string } | null> {
  // Try to get icons with common square dimensions
  const icons = await fetchSteamGridDB<SteamGridDBIcon[]>(
    `/icons/game/${gameId}?dimensions=256x256,512x512,1024x1024`
  )

  if (icons && icons.length > 0) {
    // Prefer square icons (width === height), or closest to square
    const squareIcon = icons.find(i => i.width === i.height) || icons[0]
    return {
      url: squareIcon.url,
      thumb: squareIcon.thumb,
    }
  }

  // Fallback: try any icon
  const anyIcons = await fetchSteamGridDB<SteamGridDBIcon[]>(`/icons/game/${gameId}`)
  
  if (anyIcons && anyIcons.length > 0) {
    // Sort by squareness (closer to 1:1 ratio is better)
    const sorted = anyIcons.sort((a, b) => {
      const ratioA = Math.abs(1 - (a.width / a.height))
      const ratioB = Math.abs(1 - (b.width / b.height))
      return ratioA - ratioB // Closer to 1:1 is better
    })
    
    return {
      url: sorted[0].url,
      thumb: sorted[0].thumb,
    }
  }

  return null
}

/**
 * Get logo for a game
 * Logos are typically horizontal/wide images with the game's branding
 */
export async function getGameLogo(gameId: number): Promise<{ url: string; thumb: string } | null> {
  // Try to get logos with common horizontal dimensions
  const logos = await fetchSteamGridDB<SteamGridDBLogo[]>(
    `/logos/game/${gameId}?dimensions=1920x620,1920x1080,1600x900,1200x400`
  )

  if (logos && logos.length > 0) {
    // Prefer horizontal logos (width > height), or highest score
    const horizontalLogo = logos.find(l => l.width > l.height) || logos[0]
    return {
      url: horizontalLogo.url,
      thumb: horizontalLogo.thumb,
    }
  }

  // Fallback: try any logo
  const anyLogos = await fetchSteamGridDB<SteamGridDBLogo[]>(`/logos/game/${gameId}`)
  
  if (anyLogos && anyLogos.length > 0) {
    // Sort by score (higher is better) and prefer horizontal
    const sorted = anyLogos.sort((a, b) => {
      const aIsHorizontal = a.width > a.height ? 1 : 0
      const bIsHorizontal = b.width > b.height ? 1 : 0
      if (aIsHorizontal !== bIsHorizontal) {
        return bIsHorizontal - aIsHorizontal // Prefer horizontal
      }
      return b.score - a.score // Then by score
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

  const [cover, squareCover, horizontalCover, icon, logo] = await Promise.all([
    getVerticalCover(gameId),
    getSquareCover(gameId),
    getHorizontalCover(gameId),
    getGameIcon(gameId),
    getGameLogo(gameId),
  ])

  return {
    id: game.id,
    name: game.name,
    coverUrl: cover?.url || null,
    coverThumb: cover?.thumb || null,
    squareCoverUrl: squareCover?.url || null,
    squareCoverThumb: squareCover?.thumb || null,
    horizontalCoverUrl: horizontalCover?.url || null,
    horizontalCoverThumb: horizontalCover?.thumb || null,
    iconUrl: icon?.url || null,
    iconThumb: icon?.thumb || null,
    logoUrl: logo?.url || null,
    logoThumb: logo?.thumb || null,
  }
}


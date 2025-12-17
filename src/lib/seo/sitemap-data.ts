/**
 * Sitemap data fetchers
 */

import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/slug'

/**
 * Priority games list for high-priority sitemap entries
 * These are popular games that should be prioritized in SEO
 */
const PRIORITY_GAMES = [
  'Escape From Tarkov',
  'Counter-Strike',
  'Counter-Strike 2',
  'Team Fortress 2',
  'League of Legends',
  'Minecraft',
  'ARC Raiders',
  'Grand Theft Auto V',
  'Dota 2',
  'Fortnite',
  'VALORANT',
  'World of Warcraft',
  'Call of Duty: Black Ops 7',
  'Teamfight Tactics',
  'Overwatch 2',
  'World of Tanks',
  'EA Sports FC 26',
  'Path of Exile 2',
  'Dead by Daylight',
  'Where Winds Meet',
  'Marvel Rivals',
  'Rust',
  'Call of Duty: Warzone',
  'Apex Legends',
  'Rocket League',
  'Hearthstone',
  'Clash Royale',
  'PUBG: Battlegrounds',
  'Old School RuneScape',
  'Pokémon Community Game',
  'Elden Ring',
  'Final Fantasy XIV Online',
  'Rainbow Six Siege X',
  'Street Fighter 6',
  'Arena Breakout: Infinite',
  'Star Citizen',
]

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

/**
 * Get priority games for sitemap (high priority popular games)
 */
export function getPriorityGames(): SitemapEntry[] {
  return PRIORITY_GAMES.map(gameName => {
    const gameSlug = generateSlug(gameName)
    return {
      url: `/games/${gameSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0, // Maximum priority
    }
  })
}

/**
 * Get priority "is game still active" pages for sitemap
 */
export function getPriorityIsGamePages(): SitemapEntry[] {
  return PRIORITY_GAMES.map(gameName => {
    const gameSlug = generateSlug(gameName)
    return {
      url: `/is-${gameSlug}-still-active`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0, // Maximum priority
    }
  })
}

/**
 * Get all games for sitemap
 * Fetches unique games from game_search_events and user_games
 * Uses slug-based URLs for better SEO
 */
export async function getSitemapGames(): Promise<SitemapEntry[]> {
  const supabase = createPublicSupabaseClient()
  
  try {
    // Get unique game IDs from game_search_events (games that have been searched)
    const { data: searchEvents } = await supabase
      .from('game_search_events')
      .select('game_id')
      .order('created_at', { ascending: false })
      .limit(1000) // Limit to most recent 1000 searches
    
    // Get unique game IDs from user_games (games in user libraries)
    const { data: userGames } = await supabase
      .from('user_games')
      .select('game_id')
      .order('created_at', { ascending: false })
      .limit(1000) // Limit to most recent 1000 additions
    
    // Combine and get unique game IDs
    const gameIds = new Set<string>()
    searchEvents?.forEach(event => gameIds.add(event.game_id))
    userGames?.forEach(game => gameIds.add(game.game_id))
    
    // Fetch game names from SteamGridDB to generate proper slugs
    const { getGameById } = await import('@/lib/steamgriddb')
    
    // Fetch game details in batches to avoid rate limits
    const gameIdsArray = Array.from(gameIds).slice(0, 1000) // Limit to 1000 for performance
    const entries: SitemapEntry[] = []
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 10
    for (let i = 0; i < gameIdsArray.length; i += batchSize) {
      const batch = gameIdsArray.slice(i, i + batchSize)
      const gameDetails = await Promise.all(
        batch.map(async (gameId) => {
          try {
            const game = await getGameById(parseInt(gameId, 10))
            return game ? { id: gameId, name: game.name } : null
          } catch (error) {
            console.error(`Error fetching game ${gameId}:`, error)
            return null
          }
        })
      )
      
      // Generate URLs with proper slugs
      gameDetails.forEach((game) => {
        if (game) {
          const gameSlug = generateSlug(game.name)
          entries.push({
            url: `/games/${gameSlug}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
          })
        }
      })
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < gameIdsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return entries
  } catch (error) {
    console.error('Error fetching games for sitemap:', error)
    return []
  }
}

/**
 * Get all public player profiles for sitemap
 * TODO: Fetch from Supabase
 */
export async function getSitemapPlayers(): Promise<SitemapEntry[]> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('profiles')
  //   .select('username, updated_at')
  //   .eq('is_private', false)
  
  // return data?.map(profile => ({
  //   url: `/u/${profile.username}`,
  //   lastModified: profile.updated_at ? new Date(profile.updated_at) : undefined,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // })) ?? []
  
  return []
}

/**
 * Get all public lobbies for sitemap
 * TODO: Fetch from Supabase
 */
export async function getSitemapLobbies(): Promise<SitemapEntry[]> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('lobbies')
  //   .select('id, updated_at')
  //   .eq('status', 'open')
  //   .eq('is_public', true)
  
  // return data?.map(lobby => ({
  //   url: `/lobbies/${lobby.id}`,
  //   lastModified: lobby.updated_at ? new Date(lobby.updated_at) : undefined,
  //   changeFrequency: 'hourly' as const,
  //   priority: 0.7,
  // })) ?? []
  
  return []
}

/**
 * Get all "is game still active" pages for sitemap
 * Generates URLs for games that have been searched or are in user libraries
 * Uses format: /is-{game-slug}-still-active
 */
export async function getSitemapIsGamePages(): Promise<SitemapEntry[]> {
  const supabase = createPublicSupabaseClient()
  
  try {
    // Get unique game IDs from game_search_events (games that have been searched)
    const { data: searchEvents } = await supabase
      .from('game_search_events')
      .select('game_id')
      .order('created_at', { ascending: false })
      .limit(500) // Limit to most recent 500 searches for performance
    
    // Get unique game IDs from user_games (games in user libraries)
    const { data: userGames } = await supabase
      .from('user_games')
      .select('game_id')
      .order('created_at', { ascending: false })
      .limit(500) // Limit to most recent 500 additions for performance
    
    // Combine and get unique game IDs
    const gameIds = new Set<string>()
    searchEvents?.forEach(event => gameIds.add(event.game_id))
    userGames?.forEach(game => gameIds.add(game.game_id))
    
    // Fetch game names from SteamGridDB to generate proper slugs
    // Import here to avoid circular dependencies
    const { getGameById } = await import('@/lib/steamgriddb')
    
    // Fetch game details in batches to avoid rate limits
    const gameIdsArray = Array.from(gameIds).slice(0, 500) // Limit to 500 for performance
    const entries: SitemapEntry[] = []
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 10
    for (let i = 0; i < gameIdsArray.length; i += batchSize) {
      const batch = gameIdsArray.slice(i, i + batchSize)
      const gameDetails = await Promise.all(
        batch.map(async (gameId) => {
          try {
            const game = await getGameById(parseInt(gameId, 10))
            return game ? { id: gameId, name: game.name } : null
          } catch (error) {
            console.error(`Error fetching game ${gameId}:`, error)
            return null
          }
        })
      )
      
      // Generate URLs with proper slugs
      gameDetails.forEach((game) => {
        if (game) {
          const gameSlug = generateSlug(game.name)
          entries.push({
            url: `/is-${gameSlug}-still-active`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9, // High priority for SEO-focused pages
          })
        }
      })
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < gameIdsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return entries
  } catch (error) {
    console.error('Error fetching is-game pages for sitemap:', error)
    return []
  }
}

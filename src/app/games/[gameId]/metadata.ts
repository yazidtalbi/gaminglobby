import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { getGameById } from '@/lib/steamgriddb'
import { searchGames } from '@/lib/steamgriddb'
import { slugToName, slugMatchesGameName } from '@/lib/slug'

/**
 * Generate metadata for game page
 */
export async function generateMetadata({
  params,
}: {
  params: { gameId: string }
}): Promise<Metadata> {
  const gameIdOrSlug = params.gameId
  let game = null
  
  const isNumeric = /^\d+$/.test(gameIdOrSlug)
  
  if (isNumeric) {
    // Try as ID first
    try {
      game = await getGameById(parseInt(gameIdOrSlug, 10))
    } catch (error) {
      console.error('Error fetching game by ID:', error)
    }
  } else {
    // Try as slug
    try {
      const gameName = slugToName(gameIdOrSlug)
      let results = await searchGames(gameName)
      
      // If no results and the slug is just a number, try searching with the number as-is
      if (results.length === 0 && /^\d+$/.test(gameIdOrSlug)) {
        results = await searchGames(gameIdOrSlug)
      }
      
      // Find exact match using slug matching
      const exactMatch = results.find(
        g => slugMatchesGameName(gameIdOrSlug, g.name)
      )
      
      if (exactMatch) {
        // Fetch full game details
        game = await getGameById(exactMatch.id)
      } else if (results.length > 0) {
        // If no exact match, try first result
        game = await getGameById(results[0].id)
      }
    } catch (error) {
      console.error('Error fetching game by slug:', error)
    }
  }

  if (!game || !game.name) {
    return createMetadata({
      title: 'Game',
      description: 'Join game lobbies, find teammates, and explore communities on Apoxer.',
      path: `/games/${gameIdOrSlug}`,
    })
  }

  const gameName = game.name
  const title = gameName
  const description = `Join ${gameName} lobbies, find teammates, and explore communities on Apoxer.`
  
  // Build images array with fallback chain
  const images: string[] = []
  if (game.coverUrl) {
    // Only use coverUrl if it's a safe URL (starts with http/https)
    if (game.coverUrl.startsWith('http')) {
      images.push(game.coverUrl)
    }
  }
  // Fallback to default OG image is handled in createMetadata

  return createMetadata({
    title,
    description,
    path: `/games/${gameIdOrSlug}`,
    images: images.length > 0 ? images : undefined,
  })
}

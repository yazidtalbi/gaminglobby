import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { getGameBySlug } from '@/lib/data/games'
import { siteUrl } from '@/lib/seo/site'

/**
 * Generate metadata for game page
 * Note: This uses gameId (number) but we'll try to fetch by it
 * TODO: Update getGameBySlug to handle gameId as well, or create getGameById
 */
export async function generateMetadata({
  params,
}: {
  params: { gameId: string }
}): Promise<Metadata> {
  const gameId = params.gameId
  
  // Try to get game data (for now, this will return null as it's a stub)
  // TODO: Implement actual game fetching by ID
  const game = await getGameBySlug(gameId)

  if (!game) {
    return createMetadata({
      title: 'Game Lobbies & Players',
      description: 'Join game lobbies, find teammates, and explore communities on Apoxer.',
      path: `/games/${gameId}`,
    })
  }

  const gameName = game.name
  const title = `${gameName} Lobbies & Players`
  const description = `Join ${gameName} lobbies, find teammates, and explore communities on Apoxer.`
  
  const images: string[] = []
  if (game.coverUrl) {
    // Only use coverUrl if it's a safe URL (starts with http/https)
    if (game.coverUrl.startsWith('http')) {
      images.push(game.coverUrl)
    }
  }

  return createMetadata({
    title,
    description,
    path: `/games/${gameId}`,
    images,
  })
}

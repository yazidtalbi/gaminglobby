import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { getLobbyById } from '@/lib/data/lobbies'
import { generateSlug } from '@/lib/slug'

export async function generateMetadata({
  params,
}: {
  params: { lobbyId: string }
}): Promise<Metadata> {
  const lobbyId = params.lobbyId
  
  const lobby = await getLobbyById(lobbyId)

  if (!lobby) {
    return createMetadata({
      title: `Lobby ${lobbyId} - APOXER.COM`,
      description: 'Join this lobby on APOXER.COM to match with players and coordinate your next session.',
      path: `/lobbies/${lobbyId}`,
      noIndex: true, // Unknown lobbies should not be indexed
    })
  }

  const gameName = lobby.gameName
  const gameSlug = gameName ? generateSlug(gameName) : ''
  const title = gameSlug ? `${gameSlug} Lobby` : `Lobby ${lobbyId}`
  const description = 'Join this lobby on APOXER.COM to match with players and coordinate your next session.'

  return createMetadata({
    title,
    description,
    path: `/lobbies/${lobbyId}`,
    noIndex: !lobby.isPublic,
  })
}

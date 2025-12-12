import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { getLobbyById } from '@/lib/data/lobbies'

export async function generateMetadata({
  params,
}: {
  params: { lobbyId: string }
}): Promise<Metadata> {
  const lobbyId = params.lobbyId
  
  const lobby = await getLobbyById(lobbyId)

  if (!lobby) {
    return createMetadata({
      title: `Lobby ${lobbyId}`,
      description: 'Join this lobby on Apoxer to match with players and coordinate your next session.',
      path: `/lobbies/${lobbyId}`,
    })
  }

  const gameName = lobby.gameName || 'Game'
  const title = `Lobby for ${gameName}`
  const description = 'Join this lobby on Apoxer to match with players and coordinate your next session.'

  return createMetadata({
    title,
    description,
    path: `/lobbies/${lobbyId}`,
    noIndex: !lobby.isPublic,
  })
}

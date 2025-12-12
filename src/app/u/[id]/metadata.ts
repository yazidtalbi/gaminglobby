import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { getPlayerByUsername } from '@/lib/data/players'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const idOrUsername = params.id
  
  // Try to get player data by username
  const player = await getPlayerByUsername(idOrUsername)

  if (!player) {
    return createMetadata({
      title: `Player Profile`,
      description: 'View player profile, games, lobbies, and matchmaking activity on Apoxer.',
      path: `/u/${idOrUsername}`,
    })
  }

  const displayName = player.displayName || player.username
  const title = `${displayName} (@${player.username})`
  const description = `View ${displayName}'s games, lobbies, and matchmaking activity on Apoxer.`

  return createMetadata({
    title,
    description,
    path: `/u/${player.username}`,
    noIndex: !player.isPublic,
  })
}

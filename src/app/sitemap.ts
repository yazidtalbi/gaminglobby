import { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo/site'
import { getSitemapGames, getSitemapPlayers, getSitemapLobbies } from '@/lib/seo/sitemap-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/matchmaking`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ]

  // Dynamic routes
  const [games, players, lobbies] = await Promise.all([
    getSitemapGames(),
    getSitemapPlayers(),
    getSitemapLobbies(),
  ])

  // Combine all routes
  const allRoutes: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...games.map(game => ({
      url: `${baseUrl}${game.url}`,
      lastModified: game.lastModified,
      changeFrequency: game.changeFrequency,
      priority: game.priority,
    })),
    ...players.map(player => ({
      url: `${baseUrl}${player.url}`,
      lastModified: player.lastModified,
      changeFrequency: player.changeFrequency,
      priority: player.priority,
    })),
    ...lobbies.map(lobby => ({
      url: `${baseUrl}${lobby.url}`,
      lastModified: lobby.lastModified,
      changeFrequency: lobby.changeFrequency,
      priority: lobby.priority,
    })),
  ]

  return allRoutes
}

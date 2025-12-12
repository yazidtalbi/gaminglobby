import { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo/site'
import { getSitemapGames, getSitemapPlayers } from '@/lib/seo/sitemap-data'

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
  ]

  // Dynamic routes
  const [games, players] = await Promise.all([
    getSitemapGames(),
    getSitemapPlayers(),
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
  ]

  return allRoutes
}

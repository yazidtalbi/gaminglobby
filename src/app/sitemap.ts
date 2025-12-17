import { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo/site'
import { getSitemapGames, getSitemapPlayers, getSitemapIsGamePages, getPriorityGames, getPriorityIsGamePages } from '@/lib/seo/sitemap-data'

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
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/invites`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
  ]

  // Priority games (high priority popular games)
  const priorityGames = getPriorityGames()
  const priorityIsGamePages = getPriorityIsGamePages()

  // Dynamic routes
  const [games, players, isGamePages] = await Promise.all([
    getSitemapGames(),
    getSitemapPlayers(),
    getSitemapIsGamePages(),
  ])

  // Combine all routes (priority games first)
  const allRoutes: MetadataRoute.Sitemap = [
    ...staticRoutes,
    // Priority game pages (highest priority)
    ...priorityGames.map(game => ({
      url: `${baseUrl}${game.url}`,
      lastModified: game.lastModified,
      changeFrequency: game.changeFrequency,
      priority: game.priority,
    })),
    // Priority "is game still active" pages (highest priority)
    ...priorityIsGamePages.map(page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    // Other games
    ...games.map(game => ({
      url: `${baseUrl}${game.url}`,
      lastModified: game.lastModified,
      changeFrequency: game.changeFrequency,
      priority: game.priority,
    })),
    // Player profiles
    ...players.map(player => ({
      url: `${baseUrl}${player.url}`,
      lastModified: player.lastModified,
      changeFrequency: player.changeFrequency,
      priority: player.priority,
    })),
    // Other "is game still active" pages
    ...isGamePages.map(page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  ]

  return allRoutes
}

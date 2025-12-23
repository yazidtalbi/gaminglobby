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
      priority: 1.0,
    },
    {
      url: `${baseUrl}/app`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
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
      url: `${baseUrl}/lobbies`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/players`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/invites`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
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

  // Combine all routes (prioritized order)
  const allRoutes: MetadataRoute.Sitemap = [
    // Static routes first (homepage, main pages)
    ...staticRoutes,
    // Priority game pages (highest priority popular games)
    ...priorityGames.map(game => ({
      url: `${baseUrl}${game.url}`,
      lastModified: game.lastModified,
      changeFrequency: game.changeFrequency,
      priority: game.priority,
    })),
    // Priority "is game still active" pages (high SEO value)
    ...priorityIsGamePages.map(page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    // Other games (moderate priority)
    ...games.map(game => ({
      url: `${baseUrl}${game.url}`,
      lastModified: game.lastModified,
      changeFrequency: game.changeFrequency,
      priority: game.priority,
    })),
    // Other "is game still active" pages (good for SEO)
    ...isGamePages.map(page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    // Player profiles (lower priority, but still important)
    ...players.map(player => ({
      url: `${baseUrl}${player.url}`,
      lastModified: player.lastModified,
      changeFrequency: player.changeFrequency,
      priority: player.priority,
    })),
  ]

  return allRoutes
}

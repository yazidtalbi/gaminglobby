import { siteUrl, siteName } from './site'

/**
 * Generate WebSite JSON-LD with sitelinks for search engines
 * Similar to IGDB.com's rich search results
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://apoxer.com/games?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    // Common sitelinks that appear in search results
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Browse Games',
          url: `https://apoxer.com/games`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Active Lobbies',
          url: `https://apoxer.com/`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Community',
          url: `https://apoxer.com/social`,
        },
      ],
    },
  }
}

/**
 * Generate Organization JSON-LD
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `https://apoxer.com/og-image.png`,
      width: 1200,
      height: 630,
    },
    description: 'Apoxer is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
    sameAs: [
      // Add social media links here when available
      // process.env.NEXT_PUBLIC_TWITTER_URL,
      // process.env.NEXT_PUBLIC_DISCORD_URL,
    ].filter(Boolean),
  }
}

/**
 * Generate VideoGame JSON-LD
 */
export function generateVideoGameJsonLd(
  name: string,
  url: string,
  image?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name,
    url,
    ...(image && { image }),
  }
}

/**
 * Generate Person JSON-LD
 */
export function generatePersonJsonLd(
  name: string,
  url: string,
  username?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(username && { identifier: username }),
  }
}

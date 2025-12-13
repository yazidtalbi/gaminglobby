import { siteUrl, siteName } from './site'

/**
 * Generate WebSite JSON-LD
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
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
    logo: `${siteUrl}/og-image.png`,
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

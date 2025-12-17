/**
 * SEO Site Configuration
 */

export const siteName = 'Apoxer.com'
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apoxer.com'
export const twitterHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? ''

/**
 * Check if indexing is enabled
 */
export function isIndexingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ROBOTS_INDEX !== 'false'
}

/**
 * Get default robots directive
 */
export function getDefaultRobots() {
  if (!isIndexingEnabled()) {
    return {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  }
}

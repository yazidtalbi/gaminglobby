import { MetadataRoute } from 'next'
import { siteUrl, isIndexingEnabled } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = `${siteUrl}/sitemap.xml`

  if (!isIndexingEnabled()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: sitemapUrl,
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: sitemapUrl,
  }
}

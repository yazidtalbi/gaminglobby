/**
 * Article JSON-LD Schema Generator
 * For blog posts and articles
 */

import { siteUrl, siteName } from './site'

export interface ArticleJsonLdProps {
  title: string
  description: string
  url: string
  publishedAt: string
  updatedAt?: string
  image?: string
}

export function generateArticleJsonLd({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  image,
}: ArticleJsonLdProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    ...(updatedAt && { dateModified: updatedAt }),
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}


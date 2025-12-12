import { Metadata } from 'next'
import { siteName, siteUrl } from './site'
import { sanitizeForMeta } from './sanitize'

/**
 * Build absolute URL from path
 */
export function absoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${cleanPath}`
}

/**
 * Build page title with site name
 */
export function buildTitle(title: string, includeSiteName = true): string {
  if (!includeSiteName) return title
  return `${title} | ${siteName}`
}

/**
 * Default OpenGraph configuration
 */
export function defaultOpenGraph(
  title: string,
  description: string,
  url?: string,
  images?: string[]
): Metadata['openGraph'] {
  const defaultImage = absoluteUrl('/og/default.png')
  
  return {
    type: 'website',
    siteName,
    url: url ? absoluteUrl(url) : siteUrl,
    title,
    description,
    images: images && images.length > 0 
      ? images.map(img => ({
          url: img.startsWith('http') ? img : absoluteUrl(img),
        }))
      : [{ url: defaultImage }],
  }
}

/**
 * Default Twitter card configuration
 */
export function defaultTwitterCard(
  title: string,
  description: string,
  images?: string[]
): Metadata['twitter'] {
  const defaultImage = absoluteUrl('/og/default.png')
  
  return {
    card: 'summary_large_image',
    title,
    description,
    images: images && images.length > 0 
      ? images[0].startsWith('http') ? images[0] : absoluteUrl(images[0])
      : defaultImage,
  }
}

/**
 * Build canonical URL
 */
export function buildCanonical(path: string): string {
  return absoluteUrl(path)
}

/**
 * Create metadata object with defaults
 * Note: Title will use the template from layout.tsx (%s | Apoxer)
 */
export function createMetadata({
  title,
  description,
  path,
  images,
  robots,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  images?: string[]
  robots?: Metadata['robots']
  noIndex?: boolean
}): Metadata {
  const sanitizedTitle = sanitizeForMeta(title)
  const sanitizedDescription = sanitizeForMeta(description)
  const canonical = buildCanonical(path)

  // Build full title with site name
  // Use absolute to bypass template and avoid duplication
  const fullTitle = `${sanitizedTitle} | ${siteName}`

  return {
    title: {
      absolute: fullTitle,
    },
    description: sanitizedDescription,
    alternates: {
      canonical,
    },
    openGraph: defaultOpenGraph(fullTitle, sanitizedDescription, path, images),
    twitter: defaultTwitterCard(fullTitle, sanitizedDescription, images),
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : robots,
  }
}

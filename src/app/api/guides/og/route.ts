import { NextRequest, NextResponse } from 'next/server'

interface OGMetadata {
  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null
}

/**
 * Fetch Open Graph metadata from a URL
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const metadata = await fetchOGMetadata(url)
    return NextResponse.json(metadata)
  } catch (error) {
    console.error('OG fetch error:', error)
    return NextResponse.json({ 
      ogTitle: null, 
      ogDescription: null, 
      ogImageUrl: null 
    })
  }
}

async function fetchOGMetadata(url: string): Promise<OGMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LobbyBot/1.0)',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      return { ogTitle: null, ogDescription: null, ogImageUrl: null }
    }

    const html = await response.text()
    
    // Extract OG tags using regex (simple approach without heavy dependencies)
    const ogTitle = extractMetaContent(html, 'og:title') || extractTitle(html)
    const ogDescription = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description')
    const ogImageUrl = extractMetaContent(html, 'og:image')

    return {
      ogTitle,
      ogDescription,
      ogImageUrl: ogImageUrl ? resolveUrl(ogImageUrl, url) : null,
    }
  } catch (error) {
    console.error('Failed to fetch OG metadata:', error)
    return { ogTitle: null, ogDescription: null, ogImageUrl: null }
  }
}

function extractMetaContent(html: string, property: string): string | null {
  // Match og: properties
  const ogRegex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  )
  const ogMatch = html.match(ogRegex)
  if (ogMatch) return ogMatch[1]

  // Try reverse order (content before property)
  const reverseRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    'i'
  )
  const reverseMatch = html.match(reverseRegex)
  if (reverseMatch) return reverseMatch[1]

  return null
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : null
}

function resolveUrl(imageUrl: string, baseUrl: string): string {
  try {
    return new URL(imageUrl, baseUrl).href
  } catch {
    return imageUrl
  }
}


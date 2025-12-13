import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

export const dynamic = 'force-dynamic'

const BASE = 'https://www.exophase.com'

const PLATFORMS = [
  'psn',
  'xbox',
  'steam',
  'origin',
  'blizzard',
  'retro',
  'android',
  'gog',
  'ubisoft',
  'stadia',
  'epic',
  'nintendo',
  'apple',
  'ps3',
]

function slugifyGameName(input: string): string {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function toAbs(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return BASE + url
  return url
}

async function fetchHtml(url: string) {
  const res = await axios.get(url, {
    timeout: 20000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    validateStatus: () => true,
  })

  return { status: res.status, html: res.data }
}

function isPageNotFound(status: number, html: string): boolean {
  if (status === 404) return true
  const $ = cheerio.load(html || '')
  const title = ($('title').text() || '').toLowerCase()
  const h1 = ($('h1').first().text() || '').toLowerCase()
  const bodyText = ($('body').text() || '').toLowerCase()

  return (
    title.includes('page not found') ||
    h1.includes('page not found') ||
    bodyText.includes('page not found') ||
    title.includes('404') ||
    h1.includes('404')
  )
}

async function findFirstWorkingAchievementsUrl(gameQuery: string) {
  const slug = slugifyGameName(gameQuery)

  const candidates = PLATFORMS.map(
    (p) => `${BASE}/game/${slug}-${p}/achievements/`
  )

  candidates.push(`${BASE}/game/${slug}/achievements/`)

  for (const url of candidates) {
    const { status, html } = await fetchHtml(url)

    if (status >= 500) continue

    if (!isPageNotFound(status, html)) {
      return { url, html }
    }
  }

  return null
}

function extractAllImages(html: string): string[] {
  const $ = cheerio.load(html)
  const urls = new Set<string>()

  $('img').each((_, el) => {
    const $img = $(el)

    const raw =
      $img.attr('data-src') ||
      $img.attr('src') ||
      // take first candidate from srcset
      (($img.attr('data-srcset') || $img.attr('srcset') || '').split(',')[0] || '')
        .trim()
        .split(' ')[0]

    const abs = toAbs(raw)
    if (abs) urls.add(abs)
  })

  return [...urls]
}

// GET /api/tournaments/achievement-images?game=GameName
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const gameQuery = searchParams.get('game')

    if (!gameQuery) {
      return NextResponse.json(
        { error: 'Game query parameter is required' },
        { status: 400 }
      )
    }

    const result = await findFirstWorkingAchievementsUrl(gameQuery)
    if (!result) {
      return NextResponse.json(
        { error: 'No achievements page found for this game', images: [] },
        { status: 404 }
      )
    }

    const images = extractAllImages(result.html)

    // Return all images (the filtering was too restrictive)
    // The user can select from all available images on the page
    return NextResponse.json({
      url: result.url,
      images: images.slice(0, 100), // Limit to 100 images
    })
  } catch (error) {
    console.error('Error fetching achievement images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievement images', images: [] },
      { status: 500 }
    )
  }
}

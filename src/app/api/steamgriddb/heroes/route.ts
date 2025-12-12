import { NextRequest, NextResponse } from 'next/server'

interface SteamGridDBHero {
  id: number
  score: number
  style: string
  width: number
  height: number
  nsfw: boolean
  humor: boolean
  notes: string | null
  mime: string
  language: string
  url: string
  thumb: string
  lock: boolean
  epilepsy: boolean
  upvotes: number
  downvotes: number
  author: {
    name: string
    steam64: string
    avatar: string
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gameId = searchParams.get('gameId')

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }

  try {
    const STEAMGRIDDB_API_BASE = process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'
    const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY || ''

    if (!STEAMGRIDDB_API_KEY) {
      return NextResponse.json({ error: 'SteamGridDB API key not configured' }, { status: 500 })
    }

    // Fetch heroes for the game using the heroes endpoint
    const response = await fetch(
      `${STEAMGRIDDB_API_BASE}/heroes/game/${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ heroes: [] })
    }

    const data = await response.json()
    const heroes = (data.data || []) as SteamGridDBHero[]

    // Filter out NSFW and epilepsy content
    const filteredHeroes = heroes.filter(
      (hero) => !hero.nsfw && !hero.epilepsy
    )

    return NextResponse.json({ heroes: filteredHeroes })
  } catch (error) {
    console.error('Heroes fetch error:', error)
    return NextResponse.json({ heroes: [] }, { status: 500 })
  }
}


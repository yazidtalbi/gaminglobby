import { NextRequest, NextResponse } from 'next/server'

interface SteamGridDBGrid {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }

  try {
    const STEAMGRIDDB_API_BASE = process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'
    const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY || ''

    if (!STEAMGRIDDB_API_KEY) {
      return NextResponse.json({ error: 'SteamGridDB API key not configured' }, { status: 500 })
    }

    // Fetch all vertical/portrait grids for the game
    const response = await fetch(
      `${STEAMGRIDDB_API_BASE}/grids/game/${gameId}?dimensions=600x900,342x482,660x930`,
      {
        headers: {
          Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      // If specific dimensions fail, try without dimensions filter
      const fallbackResponse = await fetch(
        `${STEAMGRIDDB_API_BASE}/grids/game/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`,
          },
          next: { revalidate: 3600 },
        }
      )

      if (!fallbackResponse.ok) {
        return NextResponse.json({ covers: [] })
      }

      const fallbackData = await fallbackResponse.json()
      const allGrids = (fallbackData.data || []) as SteamGridDBGrid[]

      // Filter for portrait orientation (height > width) and non-NSFW
      const portraitCovers = allGrids
        .filter((grid) => !grid.nsfw && !grid.epilepsy && grid.height > grid.width)
        .sort((a, b) => {
          // Sort by portrait ratio (higher height/width ratio is better)
          const ratioA = a.height / a.width
          const ratioB = b.height / b.width
          return ratioB - ratioA
        })

      return NextResponse.json({ covers: portraitCovers })
    }

    const data = await response.json()
    const grids = (data.data || []) as SteamGridDBGrid[]

    // Filter out NSFW and epilepsy content, and prefer portrait orientation (height > width)
    const filteredCovers = grids
      .filter((grid) => !grid.nsfw && !grid.epilepsy)
      .filter((grid) => grid.height > grid.width) // Portrait orientation
      .sort((a, b) => {
        // Sort by portrait ratio (higher height/width ratio is better)
        const ratioA = a.height / a.width
        const ratioB = b.height / b.width
        return ratioB - ratioA
      })

    return NextResponse.json({ covers: filteredCovers })
  } catch (error) {
    console.error('Covers fetch error:', error)
    return NextResponse.json({ covers: [] }, { status: 500 })
  }
}

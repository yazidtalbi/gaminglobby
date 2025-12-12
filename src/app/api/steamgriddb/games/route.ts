import { NextRequest, NextResponse } from 'next/server'
import { getGameById } from '@/lib/steamgriddb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameIds } = body

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: 'gameIds must be a non-empty array' }, { status: 400 })
    }

    // Limit to 50 games per request to prevent abuse
    const limitedGameIds = gameIds.slice(0, 50)

    // Fetch all games in parallel
    const games = await Promise.all(
      limitedGameIds.map(async (gameId: string | number) => {
        try {
          const gameIdNum = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId
          if (isNaN(gameIdNum)) {
            return { gameId: String(gameId), game: null, error: 'Invalid game ID' }
          }
          const game = await getGameById(gameIdNum)
          return { gameId: String(gameId), game }
        } catch (error) {
          console.error(`Error fetching game ${gameId}:`, error)
          return { gameId: String(gameId), game: null, error: 'Failed to fetch' }
        }
      })
    )

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error in batch games endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


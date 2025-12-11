import { NextRequest, NextResponse } from 'next/server'
import { getGameById } from '@/lib/steamgriddb'

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = parseInt(params.gameId, 10)
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    const game = await getGameById(gameId)
    return NextResponse.json(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}


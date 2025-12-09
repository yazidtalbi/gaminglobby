import { NextRequest, NextResponse } from 'next/server'
import { getGameById } from '@/lib/steamgriddb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gameId = searchParams.get('id')

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
  }

  try {
    const game = await getGameById(parseInt(gameId, 10))
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({ game })
  } catch (error) {
    console.error('Game fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}


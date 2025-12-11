import { NextRequest, NextResponse } from 'next/server'
import { getGameById, searchGames } from '@/lib/steamgriddb'
import { slugToName, slugMatchesGameName } from '@/lib/slug'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const gameId = searchParams.get('id')
  const slug = searchParams.get('slug')

  // If slug is provided, search for the game by name
  if (slug) {
    try {
      const gameName = slugToName(slug)
      
      // For very short queries (like single numbers), SteamGridDB might not return good results
      // So we'll try multiple search strategies
      let results = await searchGames(gameName)
      
      // If no results and the slug is just a number, try searching with the number as-is
      if (results.length === 0 && /^\d+$/.test(slug)) {
        results = await searchGames(slug)
      }
      
      // Find exact match using slug matching
      const exactMatch = results.find(
        g => slugMatchesGameName(slug, g.name)
      )
      
      if (exactMatch) {
        // Fetch full game details
        const game = await getGameById(exactMatch.id)
        if (game) {
          return NextResponse.json({ game })
        }
      }
      
      // If no exact match, try first result if we have any
      if (results.length > 0) {
        const game = await getGameById(results[0].id)
        if (game) {
          return NextResponse.json({ game })
        }
      }
      
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    } catch (error) {
      console.error('Game fetch by slug error:', error)
      return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
    }
  }

  // If ID is provided, use existing logic
  if (!gameId) {
    return NextResponse.json({ error: 'Game ID or slug required' }, { status: 400 })
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


import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { gameIds } = await request.json()
    
    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ counts: {} }, { status: 200 })
    }

    const supabase = await createServerSupabaseClient()

    // Get lobby counts for each game
    const { data, error } = await supabase
      .from('lobbies')
      .select('game_id')
      .in('game_id', gameIds)
      .in('status', ['open', 'in_progress'])

    if (error) {
      console.error('Error fetching lobby counts:', error)
      return NextResponse.json({ counts: {} }, { status: 200 })
    }

    // Count lobbies per game
    const counts: Record<string, number> = {}
    data?.forEach((lobby) => {
      counts[lobby.game_id] = (counts[lobby.game_id] || 0) + 1
    })

    // Ensure all gameIds have a count (even if 0)
    gameIds.forEach((gameId) => {
      if (!(gameId in counts)) {
        counts[gameId] = 0
      }
    })

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('Error in lobby count API:', error)
    return NextResponse.json({ counts: {} }, { status: 200 })
  }
}


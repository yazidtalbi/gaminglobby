import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateEventsFromRound } from '@/lib/events/generate-events'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin check here
    // For now, allow any authenticated user (you should restrict this)

    const body = await request.json()
    const { round_id, top_n = 3 } = body

    // If no round_id provided, find the most recent locked round
    let targetRoundId = round_id
    
    if (!targetRoundId) {
      const { data: lockedRound } = await supabase
        .from('weekly_rounds')
        .select('*')
        .eq('status', 'locked')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!lockedRound) {
        return NextResponse.json({ error: 'No locked round found' }, { status: 404 })
      }
      
      targetRoundId = lockedRound.id
    }

    // Generate events and create new round
    const result = await generateEventsFromRound(supabase, targetRoundId, top_n)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


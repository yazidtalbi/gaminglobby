import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateEventsFromRound } from '@/lib/events/generate-events'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin check here
    // For now, allow any authenticated user (you should restrict this)

    // Get the current open round
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError) {
      if (roundError.code === 'PGRST116') {
        return NextResponse.json({ error: 'No open round found' }, { status: 404 })
      }
      console.error('Error fetching current round:', roundError)
      return NextResponse.json({ error: 'Failed to fetch current round' }, { status: 500 })
    }

    if (!currentRound) {
      return NextResponse.json({ error: 'No open round found' }, { status: 404 })
    }

    // Lock the round
    const { error: updateError } = await supabase
      .from('weekly_rounds')
      .update({
        status: 'locked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRound.id)

    if (updateError) {
      console.error('Error locking round:', updateError)
      return NextResponse.json({ error: 'Failed to lock round' }, { status: 500 })
    }

    // Automatically generate events from top 3 candidates and create new round
    try {
      const result = await generateEventsFromRound(supabase, currentRound.id, 3)
      
      return NextResponse.json({
        message: 'Round locked and events generated successfully',
        round: {
          id: currentRound.id,
          week_key: currentRound.week_key,
          status: 'processed',
        },
        events: result.events,
        newRound: result.newRound,
      })
    } catch (error: any) {
      console.error('Error generating events:', error)
      // Still return success for locking, but note events generation failed
      return NextResponse.json({
        message: 'Round locked successfully, but event generation failed',
        error: error.message,
        round: {
          id: currentRound.id,
          week_key: currentRound.week_key,
          status: 'locked',
        },
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


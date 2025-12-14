import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const voteSelectionSchema = z.object({
  selection_id: z.string().uuid(),
  day_pref: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  time_pref: z.enum(['morning', 'noon', 'afternoon', 'evening', 'late_night']),
})

// POST /api/events/selections/vote - Submit day/time selection for a game
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = voteSelectionSchema.parse(body)

    // Check if selection exists and is still open
    const { data: selection, error: selectionError } = await supabase
      .from('weekly_game_selections')
      .select('*')
      .eq('id', validated.selection_id)
      .single()

    if (selectionError || !selection) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 })
    }

    // Check if deadline has passed
    if (new Date(selection.selection_deadline) < new Date()) {
      return NextResponse.json({ error: 'Selection deadline has passed' }, { status: 400 })
    }

    // Check if events have already been created
    if (selection.events_created) {
      return NextResponse.json({ error: 'Events have already been created for this selection' }, { status: 400 })
    }

    // Upsert user's selection vote
    const { error: voteError } = await supabase
      .from('weekly_game_selection_votes')
      .upsert({
        selection_id: validated.selection_id,
        user_id: user.id,
        day_pref: validated.day_pref,
        time_pref: validated.time_pref,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'selection_id,user_id',
      })

    if (voteError) {
      console.error('Error submitting selection vote:', voteError)
      return NextResponse.json({ error: 'Failed to submit selection' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Selection submitted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

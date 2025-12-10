import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = params
    const body = await request.json()
    const { status } = body

    if (!status || !['in', 'maybe', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Upsert participant status
    const { data: participant, error } = await supabase
      .from('event_participants')
      .upsert(
        {
          event_id: eventId,
          user_id: user.id,
          status,
        },
        {
          onConflict: 'event_id,user_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating participant:', error)
      return NextResponse.json({ error: 'Failed to update participation' }, { status: 500 })
    }

    // Update last_active_at
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ participant })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


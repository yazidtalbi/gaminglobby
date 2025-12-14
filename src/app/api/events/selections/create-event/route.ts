import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createEventSchema = z.object({
  selection_id: z.string().uuid(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  time_slot: z.enum(['morning', 'noon', 'afternoon', 'evening', 'late_night']),
})

/**
 * Create an event for a specific selection
 * POST /api/events/selections/create-event
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is founder
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    if (profile?.plan_tier !== 'founder') {
      return NextResponse.json({ error: 'Only founders can create events' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createEventSchema.parse(body)

    // Get the selection
    const { data: selection, error: selectionError } = await supabase
      .from('weekly_game_selections')
      .select('*, round:weekly_rounds(*)')
      .eq('id', validated.selection_id)
      .single()

    if (selectionError || !selection) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 })
    }

    // Check if event already created
    if (selection.events_created) {
      return NextResponse.json({ error: 'Event has already been created for this selection' }, { status: 400 })
    }

    const round = selection.round as any

    // Calculate event start/end times based on day and time slot
    const eventDate = getNextDateForDay(validated.day)
    const { startTime, endTime } = getTimeSlotRange(validated.time_slot)

    const startsAt = new Date(`${eventDate}T${startTime}`)
    let endsAt = new Date(`${eventDate}T${endTime}`)

    // Handle late_night that goes past midnight
    if (validated.time_slot === 'late_night' && endTime === '23:59:59') {
      const nextDay = new Date(startsAt)
      nextDay.setDate(nextDay.getDate() + 1)
      endsAt = new Date(`${nextDay.toISOString().split('T')[0]}T00:00:00`)
    }

    // Get or create game event community
    let { data: community } = await supabase
      .from('game_event_communities')
      .select('id')
      .eq('game_id', selection.game_id)
      .single()

    if (!community) {
      const { data: newCommunity, error: communityError } = await supabase
        .from('game_event_communities')
        .insert({
          game_id: selection.game_id,
          game_name: selection.game_name,
          created_from_round_id: round.id,
        })
        .select()
        .single()

      if (communityError || !newCommunity) {
        console.error('Error creating community:', communityError)
        return NextResponse.json({ error: 'Failed to create community' }, { status: 500 })
      }
      community = newCommunity
    }

    if (!community) {
      return NextResponse.json({ error: 'Failed to get or create community' }, { status: 500 })
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        game_id: selection.game_id,
        game_name: selection.game_name,
        community_id: community.id,
        round_id: round.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        time_slot: validated.time_slot,
        status: 'scheduled',
        total_votes: 0,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json({ error: 'Failed to create event', details: eventError.message }, { status: 500 })
    }

    // Mark selection as processed
    await supabase
      .from('weekly_game_selections')
      .update({
        selected_day: validated.day,
        selected_time_slot: validated.time_slot,
        events_created: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selection.id)

    return NextResponse.json({
      success: true,
      message: `Event created successfully for ${selection.game_name}`,
      event: {
        id: event.id,
        game_name: event.game_name,
        starts_at: event.starts_at,
        time_slot: event.time_slot,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getNextDateForDay(day: string): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDay = days.indexOf(day.toLowerCase())
  const today = new Date()
  const currentDay = today.getDay()
  
  let daysUntil = targetDay - currentDay
  if (daysUntil <= 0) {
    daysUntil += 7 // Next week
  }
  
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysUntil)
  
  return targetDate.toISOString().split('T')[0]
}

function getTimeSlotRange(timeSlot: string): { startTime: string; endTime: string } {
  const ranges: Record<string, { startTime: string; endTime: string }> = {
    morning: { startTime: '09:00:00', endTime: '12:00:00' },
    noon: { startTime: '12:00:00', endTime: '15:00:00' },
    afternoon: { startTime: '15:00:00', endTime: '18:00:00' },
    evening: { startTime: '18:00:00', endTime: '21:00:00' },
    late_night: { startTime: '21:00:00', endTime: '23:59:59' },
  }
  
  return ranges[timeSlot] || ranges.evening
}

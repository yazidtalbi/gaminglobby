import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { eventId } = params

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Update status if needed
    const now = new Date()
    const startsAt = new Date(event.starts_at)
    const endsAt = new Date(event.ends_at)

    let currentStatus = event.status
    if (event.status === 'scheduled' && now >= startsAt && now < endsAt) {
      currentStatus = 'ongoing'
      await supabase
        .from('events')
        .update({ status: 'ongoing' })
        .eq('id', eventId)
    } else if (event.status === 'ongoing' && now >= endsAt) {
      currentStatus = 'ended'
      await supabase
        .from('events')
        .update({ status: 'ended' })
        .eq('id', eventId)
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('event_participants')
      .select(`
        *,
        profile:profiles(id, username, avatar_url, display_name)
      `)
      .eq('event_id', eventId)
      .eq('status', 'in')

    // Get attached guides
    const { data: eventGuides, error: guidesError } = await supabase
      .from('event_guides')
      .select(`
        *,
        guide:game_guides(*)
      `)
      .eq('event_id', eventId)

    // Get community info
    const { data: community } = await supabase
      .from('game_event_communities')
      .select('*')
      .eq('id', event.community_id)
      .single()

    return NextResponse.json({
      event: { ...event, status: currentStatus },
      participants: participants || [],
      guides: eventGuides?.map((eg) => eg.guide) || [],
      community: community || null,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


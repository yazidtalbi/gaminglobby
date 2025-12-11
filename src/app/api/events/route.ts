import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'upcoming'

    const nowISO = new Date().toISOString()
    const now = new Date()
    
    let query = supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true })

    // Filter by status
    if (status === 'upcoming') {
      // For upcoming, show scheduled/ongoing events that haven't ended yet
      query = query
        .in('status', ['scheduled', 'ongoing'])
        .gte('ends_at', nowISO) // Only events that haven't ended
    } else if (status === 'ongoing') {
      query = query.eq('status', 'ongoing')
    } else if (status === 'ended') {
      query = query.eq('status', 'ended')
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Update event statuses based on current time
    const updatedEvents = await Promise.all(
      (events || []).map(async (event) => {
        const startsAt = new Date(event.starts_at)
        const endsAt = new Date(event.ends_at)

        let newStatus = event.status

        if (event.status === 'scheduled' && now >= startsAt && now < endsAt) {
          newStatus = 'ongoing'
          await supabase
            .from('events')
            .update({ status: 'ongoing' })
            .eq('id', event.id)
        } else if (event.status === 'ongoing' && now >= endsAt) {
          newStatus = 'ended'
          await supabase
            .from('events')
            .update({ status: 'ended' })
            .eq('id', event.id)
        }

        return { ...event, status: newStatus }
      })
    )

    return NextResponse.json({ events: updatedEvents })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


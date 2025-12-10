import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper function to get the most voted time slot
function getDominantTimeSlot(distribution: Record<string, number>): string {
  const entries = Object.entries(distribution)
  const maxEntry = entries.reduce((max, [key, value]) => 
    value > max[1] ? [key, value] : max, 
    ['evening', 0]
  )
  return maxEntry[0]
}

// Helper function to calculate event start time based on week and time slot
function calculateEventStartTime(weekKey: string, timeSlot: string): Date {
  // Parse week key (e.g., "2025-W10" or ISO date string)
  // For simplicity, assume weekKey is a Monday date
  // In production, you'd parse this properly
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1) // Get Monday of current week
  
  // Add days to get to Saturday (day 6)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  
  // Set time based on time slot
  const timeSlots: Record<string, number> = {
    morning: 10,    // 10:00
    noon: 12,       // 12:00
    afternoon: 15,  // 15:00
    evening: 18,    // 18:00
    late_night: 21, // 21:00
  }
  
  saturday.setHours(timeSlots[timeSlot] || 18, 0, 0, 0)
  return saturday
}

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

    if (!round_id) {
      return NextResponse.json({ error: 'Missing round_id' }, { status: 400 })
    }

    // Get the round
    const { data: round, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('id', round_id)
      .single()

    if (roundError || !round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status === 'processed') {
      return NextResponse.json({ error: 'Events already generated for this round' }, { status: 400 })
    }

    // Lock the round
    await supabase
      .from('weekly_rounds')
      .update({ status: 'locked' })
      .eq('id', round_id)

    // Get top N candidates by votes
    const { data: topCandidates, error: candidatesError } = await supabase
      .from('weekly_game_candidates')
      .select('*')
      .eq('round_id', round_id)
      .order('total_votes', { ascending: false })
      .limit(top_n)

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    if (!topCandidates || topCandidates.length === 0) {
      return NextResponse.json({ error: 'No candidates found' }, { status: 400 })
    }

    const createdEvents = []

    // Process each top candidate
    for (const candidate of topCandidates) {
      // Get time preference distribution
      const { data: votes } = await supabase
        .from('weekly_game_votes')
        .select('time_pref')
        .eq('candidate_id', candidate.id)

      const distribution: Record<string, number> = {
        morning: 0,
        noon: 0,
        afternoon: 0,
        evening: 0,
        late_night: 0,
      }

      votes?.forEach((vote) => {
        distribution[vote.time_pref]++
      })

      const dominantTimeSlot = getDominantTimeSlot(distribution)
      const startsAt = calculateEventStartTime(round.week_key, dominantTimeSlot)
      const endsAt = new Date(startsAt)
      endsAt.setHours(endsAt.getHours() + 6) // 6-hour event window

      // Ensure community exists for this game
      let { data: community } = await supabase
        .from('game_event_communities')
        .select('*')
        .eq('game_id', candidate.game_id)
        .single()

      if (!community) {
        const { data: newCommunity, error: communityError } = await supabase
          .from('game_event_communities')
          .insert({
            game_id: candidate.game_id,
            game_name: candidate.game_name,
            created_from_round_id: round_id,
          })
          .select()
          .single()

        if (communityError) {
          console.error('Error creating community:', communityError)
          continue
        }
        community = newCommunity
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          game_id: candidate.game_id,
          game_name: candidate.game_name,
          community_id: community.id,
          round_id: round_id,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          time_slot: dominantTimeSlot,
          status: 'scheduled',
          total_votes: candidate.total_votes,
        })
        .select()
        .single()

      if (eventError) {
        console.error('Error creating event:', eventError)
        continue
      }

      createdEvents.push(event)
    }

    // Mark round as processed
    await supabase
      .from('weekly_rounds')
      .update({ 
        status: 'processed',
        events_generated_at: new Date().toISOString(),
      })
      .eq('id', round_id)

    return NextResponse.json({ events: createdEvents })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


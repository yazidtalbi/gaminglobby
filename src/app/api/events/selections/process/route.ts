import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Process selection phase: Create events from selections and start new weekly vote
 * This should be called by a cron job or manually after selection deadline
 * POST /api/events/selections/process
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication (should be server/cron only)
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
      return NextResponse.json({ error: 'Only founders can process selections' }, { status: 403 })
    }

    // Find locked rounds with selection phase deadline passed but not completed
    const now = new Date().toISOString()
    const { data: roundsToProcess, error: roundsError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'locked')
      .eq('selection_phase_completed', false)
      .lte('selection_phase_deadline', now)

    if (roundsError) {
      return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 })
    }

    if (!roundsToProcess || roundsToProcess.length === 0) {
      return NextResponse.json({ message: 'No rounds to process' })
    }

    const results = []

    for (const round of roundsToProcess) {
      // Get all selections for this round
      const { data: selections, error: selectionsError } = await supabase
        .from('weekly_game_selections')
        .select('*')
        .eq('round_id', round.id)
        .eq('events_created', false)

      if (selectionsError || !selections || selections.length === 0) {
        continue
      }

      // For each selection, determine the most popular day/time combination
      for (const selection of selections) {
        // Get all votes for this selection
        const { data: votes, error: votesError } = await supabase
          .from('weekly_game_selection_votes')
          .select('day_pref, time_pref')
          .eq('selection_id', selection.id)

        if (votesError || !votes || votes.length === 0) {
          // No votes, use defaults
          const defaultDay = 'saturday'
          const defaultTime = 'evening'
          
          // Create event with defaults
          await createEventForSelection(supabase, selection, round, defaultDay, defaultTime)
          continue
        }

        // Count votes for each day/time combination
        const voteCounts: Record<string, number> = {}
        votes.forEach(vote => {
          const key = `${vote.day_pref}_${vote.time_pref}`
          voteCounts[key] = (voteCounts[key] || 0) + 1
        })

        // Find the most popular combination
        const mostPopular = Object.entries(voteCounts)
          .sort((a, b) => b[1] - a[1])[0]

        if (mostPopular) {
          const [day, time] = mostPopular[0].split('_')
          await createEventForSelection(supabase, selection, round, day, time)
        } else {
          // Fallback to defaults
          await createEventForSelection(supabase, selection, round, 'saturday', 'evening')
        }
      }

      // Mark round as processed
      await supabase
        .from('weekly_rounds')
        .update({
          status: 'processed',
          selection_phase_completed: true,
          events_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', round.id)

      // Create new weekly vote
      const nextWeekKey = getNextWeekKey(round.week_key)
      const votingEndsAt = new Date()
      votingEndsAt.setDate(votingEndsAt.getDate() + 7)

      const { data: newRound, error: newRoundError } = await supabase
        .from('weekly_rounds')
        .insert({
          week_key: nextWeekKey,
          status: 'open',
          voting_ends_at: votingEndsAt.toISOString(),
        })
        .select()
        .single()

      if (newRoundError) {
        console.error('Error creating new round:', newRoundError)
      }

      results.push({
        round_id: round.id,
        week_key: round.week_key,
        events_created: selections.length,
        new_round_created: !!newRound,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${roundsToProcess.length} round(s)`,
      results,
    })
  } catch (error) {
    console.error('Unexpected error processing selections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createEventForSelection(
  supabase: any,
  selection: any,
  round: any,
  day: string,
  timeSlot: string
) {
  // Calculate event start/end times based on day and time slot
  const eventDate = getNextDateForDay(day)
  const { startTime, endTime } = getTimeSlotRange(timeSlot)

  let startsAt = new Date(`${eventDate}T${startTime}`)
  let endsAt = new Date(`${eventDate}T${endTime}`)

  // Handle late_night that goes past midnight
  if (timeSlot === 'late_night' && endTime === '23:59:59') {
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

    if (communityError) {
      console.error('Error creating community:', communityError)
      return
    }
    community = newCommunity
  }

  // Create event
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      game_id: selection.game_id,
      game_name: selection.game_name,
      community_id: community.id,
      round_id: round.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      time_slot: timeSlot,
      status: 'scheduled',
      total_votes: 0,
    })

  if (eventError) {
    console.error('Error creating event:', eventError)
    return
  }

  // Mark selection as processed
  await supabase
    .from('weekly_game_selections')
    .update({
      selected_day: day,
      selected_time_slot: timeSlot,
      events_created: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', selection.id)
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

function getNextWeekKey(currentWeekKey: string): string {
  // Parse current week key (e.g., "2025-W10")
  const match = currentWeekKey.match(/(\d{4})-W(\d+)/)
  if (!match) {
    // Fallback: generate from current date
    const now = new Date()
    const year = now.getFullYear()
    const week = getWeekNumber(now)
    return `${year}-W${week.toString().padStart(2, '0')}`
  }

  const year = parseInt(match[1])
  const week = parseInt(match[2])
  
  let nextYear = year
  let nextWeek = week + 1
  
  if (nextWeek > 52) {
    nextWeek = 1
    nextYear = year + 1
  }
  
  return `${nextYear}-W${nextWeek.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

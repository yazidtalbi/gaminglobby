import { SupabaseClient } from '@supabase/supabase-js'

// Helper function to get the most voted time slot (only afternoon or late_night)
// If tied or no votes, randomly pick one
function getDominantTimeSlot(distribution: Record<string, number>): string {
  const afternoonVotes = distribution.afternoon || 0
  const lateNightVotes = distribution.late_night || 0
  
  if (afternoonVotes > lateNightVotes) {
    return 'afternoon'
  } else if (lateNightVotes > afternoonVotes) {
    return 'late_night'
  } else {
    // Tie or no votes - randomly pick one
    return Math.random() < 0.5 ? 'afternoon' : 'late_night'
  }
}

// Helper function to get the most voted day
// If tied or no votes, randomly pick one
function getDominantDay(dayDistribution: Record<string, number>): string {
  const entries = Object.entries(dayDistribution)
  const maxVotes = Math.max(...entries.map(([_, votes]) => votes), 0)
  
  if (maxVotes === 0) {
    // No votes - default to Saturday
    return 'saturday'
  }
  
  const topDays = entries.filter(([_, votes]) => votes === maxVotes).map(([day]) => day)
  
  // If multiple days have the same max votes, randomly pick one
  return topDays[Math.floor(Math.random() * topDays.length)]
}

// Helper function to calculate event start time based on week, day, and time slot
// Events should be scheduled for the NEXT occurrence of the chosen day
function calculateEventStartTime(weekKey: string, daySlot: string, timeSlot: string): Date {
  const now = new Date()
  
  // Map day names to day offsets (Monday = 1, Sunday = 0 for getDay())
  const dayNumbers: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  }
  
  const targetDayNumber = dayNumbers[daySlot] || 6 // Default to Saturday
  
  // Calculate days until next occurrence of the target day
  const currentDay = now.getDay()
  let daysUntilTarget = targetDayNumber - currentDay
  
  // If the target day has already passed this week, schedule for next week
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7
  }
  
  // Create target date
  const targetDay = new Date(now)
  targetDay.setDate(now.getDate() + daysUntilTarget)
  
  // Set time based on time slot (only afternoon or late_night)
  const timeSlots: Record<string, number> = {
    afternoon: 15,  // 15:00
    late_night: 21, // 21:00
  }
  
  targetDay.setHours(timeSlots[timeSlot] || 15, 0, 0, 0)
  return targetDay
}

// Helper function to get ISO week string (e.g., "2025-W10")
function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

export async function generateEventsFromRound(
  supabase: SupabaseClient,
  roundId: string,
  topN: number = 3
) {
  // Get the round
  const { data: round, error: roundError } = await supabase
    .from('weekly_rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  if (roundError || !round) {
    throw new Error('Round not found')
  }

  if (round.status === 'processed') {
    throw new Error('Events already generated for this round')
  }

  // Lock the round if it's still open
  if (round.status === 'open') {
    await supabase
      .from('weekly_rounds')
      .update({ status: 'locked' })
      .eq('id', roundId)
  }

  // Get top N candidates by votes (recalculate from actual votes)
  const { data: allCandidates, error: candidatesError } = await supabase
    .from('weekly_game_candidates')
    .select('*')
    .eq('round_id', roundId)

  if (candidatesError) {
    throw new Error('Failed to fetch candidates')
  }

  // Recalculate votes for all candidates and sort
  const candidatesWithVotes = await Promise.all(
    (allCandidates || []).map(async (candidate) => {
      const { count } = await supabase
        .from('weekly_game_votes')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', candidate.id)

      return {
        ...candidate,
        total_votes: count || 0,
      }
    })
  )

  // Sort by votes and get top N
  const topCandidates = candidatesWithVotes
    .sort((a, b) => b.total_votes - a.total_votes)
    .slice(0, topN)

  if (topCandidates.length === 0) {
    throw new Error('No candidates found')
  }

  const createdEvents = []

  // Process each top candidate
  for (const candidate of topCandidates) {
    // Get time and day preference distribution
    const { data: votes } = await supabase
      .from('weekly_game_votes')
      .select('time_pref, day_pref')
      .eq('candidate_id', candidate.id)

    const timeDistribution: Record<string, number> = {
      afternoon: 0,
      late_night: 0,
    }

    const dayDistribution: Record<string, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    }

    votes?.forEach((vote) => {
      // Only count afternoon and late_night votes
      if (vote.time_pref === 'afternoon' || vote.time_pref === 'late_night') {
        timeDistribution[vote.time_pref]++
      }
      if (vote.day_pref) {
        dayDistribution[vote.day_pref]++
      }
    })

    const dominantTimeSlot = getDominantTimeSlot(timeDistribution)
    const dominantDay = getDominantDay(dayDistribution)
    const startsAt = calculateEventStartTime(round.week_key, dominantDay, dominantTimeSlot)
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
          created_from_round_id: roundId,
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
        round_id: roundId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        time_slot: dominantTimeSlot,
        day_slot: dominantDay,
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
    .eq('id', roundId)

  // Automatically create a new round for the next week
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7) // Next week
  const nextWeekKey = getISOWeekString(nextWeek)
  
  // Calculate voting end date (7 days from now)
  const votingEndsAt = new Date()
  votingEndsAt.setDate(votingEndsAt.getDate() + 7)
  votingEndsAt.setHours(23, 59, 59, 999) // End of day

  // Check if a round for next week already exists
  const { data: existingNextRound } = await supabase
    .from('weekly_rounds')
    .select('*')
    .eq('week_key', nextWeekKey)
    .single()

  let newRound = null
  if (!existingNextRound) {
    // Create new round for next week
    const { data: createdRound, error: createError } = await supabase
      .from('weekly_rounds')
      .insert({
        week_key: nextWeekKey,
        status: 'open',
        voting_ends_at: votingEndsAt.toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating new round:', createError)
      // Don't fail the whole operation if new round creation fails
    } else {
      newRound = createdRound
    }
  } else {
    newRound = existingNextRound
  }

  return {
    events: createdEvents,
    newRound,
  }
}


import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Popular games with their SteamGridDB IDs (using real IDs would be better)
const popularGames = [
  { id: '123456', name: 'Counter-Strike 2' },
  { id: '123457', name: 'Dota 2' },
  { id: '123458', name: 'Apex Legends' },
  { id: '123459', name: 'Valorant' },
  { id: '123460', name: 'League of Legends' },
  { id: '123461', name: 'Rocket League' },
  { id: '123462', name: 'Among Us' },
  { id: '123463', name: 'Fortnite' },
  { id: '123464', name: 'Minecraft' },
  { id: '123465', name: 'GTA V' },
  { id: '123466', name: 'Call of Duty: Warzone' },
  { id: '123467', name: 'Overwatch 2' },
  { id: '123468', name: 'Rainbow Six Siege' },
  { id: '123469', name: 'PUBG' },
  { id: '123470', name: 'Destiny 2' },
]

const timeSlots = ['afternoon', 'late_night']
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const statuses = ['scheduled', 'ongoing']

// Helper to get next occurrence of a day
function getNextDay(dayName: string): Date {
  const dayNumbers: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  }

  const targetDay = dayNumbers[dayName] || 6
  const now = new Date()
  const currentDay = now.getDay()
  let daysUntilTarget = targetDay - currentDay

  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7
  }

  const targetDate = new Date(now)
  targetDate.setDate(now.getDate() + daysUntilTarget)
  return targetDate
}

// Helper to set time based on slot
function setTimeSlot(date: Date, timeSlot: string): Date {
  const times: Record<string, number> = {
    afternoon: 15, // 15:00
    late_night: 21, // 21:00
  }
  date.setHours(times[timeSlot] || 15, 0, 0, 0)
  return date
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin check here
    // For now, allow any authenticated user

    // Get an existing round
    const { data: existingRounds } = await supabase
      .from('weekly_rounds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!existingRounds || existingRounds.length === 0) {
      return NextResponse.json({ error: 'No rounds found. Please create a round first.' }, { status: 400 })
    }

    const roundId = existingRounds[0].id
    const numEvents = 10 // Create 10 random events

    const eventsToCreate = []

    for (let i = 0; i < numEvents; i++) {
      const game = popularGames[Math.floor(Math.random() * popularGames.length)]
      const daySlot = days[Math.floor(Math.random() * days.length)]
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Calculate start time
      const startsAt = getNextDay(daySlot)
      setTimeSlot(startsAt, timeSlot)

      // Add some randomness to dates (spread over next 4 weeks)
      const daysOffset = Math.floor(Math.random() * 28)
      startsAt.setDate(startsAt.getDate() + daysOffset)

      // For ongoing events, make them start in the past
      if (status === 'ongoing') {
        startsAt.setDate(startsAt.getDate() - Math.floor(Math.random() * 3))
      }

      const endsAt = new Date(startsAt)
      endsAt.setHours(endsAt.getHours() + 6) // 6-hour event window

      // Ensure community exists
      let { data: community } = await supabase
        .from('game_event_communities')
        .select('*')
        .eq('game_id', game.id)
        .single()

      if (!community) {
        const { data: newCommunity, error: communityError } = await supabase
          .from('game_event_communities')
          .insert({
            game_id: game.id,
            game_name: game.name,
            created_from_round_id: roundId,
          })
          .select()
          .single()

        if (communityError) {
          console.error(`Error creating community for ${game.name}:`, communityError)
          continue
        }
        community = newCommunity
      }

      eventsToCreate.push({
        game_id: game.id,
        game_name: game.name,
        community_id: community.id,
        round_id: roundId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        time_slot: timeSlot,
        day_slot: daySlot,
        status: status,
        total_votes: Math.floor(Math.random() * 50) + 5, // Random vote count between 5-55
      })
    }

    // Insert events
    const { data: createdEvents, error: eventsError } = await supabase
      .from('events')
      .insert(eventsToCreate)
      .select()

    if (eventsError) {
      console.error('Error creating events:', eventsError)
      return NextResponse.json({ error: 'Failed to create events', details: eventsError.message }, { status: 500 })
    }

    // Optionally create some participants
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(20)

    let participantsCreated = 0
    if (users && users.length > 0 && createdEvents) {
      const participantsToCreate: any[] = []
      
      createdEvents.forEach((event) => {
        // Add 2-5 random participants per event
        const numParticipants = Math.floor(Math.random() * 4) + 2
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random())
        
        for (let i = 0; i < Math.min(numParticipants, shuffledUsers.length); i++) {
          const statuses = ['in', 'maybe', 'declined']
          participantsToCreate.push({
            event_id: event.id,
            user_id: shuffledUsers[i].id,
            status: statuses[Math.floor(Math.random() * statuses.length)],
          })
        }
      })

      if (participantsToCreate.length > 0) {
        const { error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantsToCreate)

        if (!participantsError) {
          participantsCreated = participantsToCreate.length
        }
      }
    }

    return NextResponse.json({
      message: 'Events seeded successfully',
      eventsCreated: createdEvents?.length || 0,
      participantsCreated,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


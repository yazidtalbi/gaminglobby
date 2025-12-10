require('dotenv').config({ path: '.env.local' })

// Use API endpoint (recommended - bypasses RLS)
// Make sure dev server is running: npm run dev
async function seedViaAPI() {
  try {
    console.log('🌱 Seeding events via API endpoint...\n')
    console.log('💡 Make sure dev server is running (npm run dev)\n')
    
    // Use node's built-in fetch (Node 18+) or install node-fetch
    let fetch
    try {
      fetch = globalThis.fetch || require('node-fetch')
    } catch {
      console.error('❌ Please install node-fetch: npm install node-fetch')
      process.exit(1)
    }
    
    const response = await fetch('http://localhost:3000/api/events/seed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${data.message}`)
      console.log(`   Events created: ${data.eventsCreated}`)
      console.log(`   Participants created: ${data.participantsCreated}`)
      console.log('\n✨ Seeding complete!')
    } else {
      const error = await response.text()
      console.error('❌ Error:', error)
      console.log('\n💡 Make sure:')
      console.log('   1. Dev server is running (npm run dev)')
      console.log('   2. You are authenticated (logged in)')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
    process.exit(1)
  }
}

// Run the API-based seeding
seedViaAPI()

// Fallback: Direct database access (requires service role key)
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('💡 Use --api flag to seed via API endpoint (recommended)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Popular games with their SteamGridDB IDs
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
function getNextDay(dayName) {
  const dayNumbers = {
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
function setTimeSlot(date, timeSlot) {
  const times = {
    afternoon: 15, // 15:00
    late_night: 21, // 21:00
  }
  date.setHours(times[timeSlot] || 15, 0, 0, 0)
  return date
}

async function seedEvents() {
  try {
    console.log('🌱 Seeding events...\n')

    // Get an existing round (any status)
    const { data: existingRounds } = await supabase
      .from('weekly_rounds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    let roundId = null
    if (existingRounds && existingRounds.length > 0) {
      roundId = existingRounds[0].id
      console.log(`Using existing round: ${existingRounds[0].week_key} (${existingRounds[0].status})`)
    } else {
      console.error('❌ No rounds found in database. Please create a round first.')
      console.log('💡 You can create one via: POST /api/events/rounds/open')
      return
    }

    const eventsToCreate = []
    const numEvents = 10 // Create 10 random events

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

    console.log(`\n📅 Creating ${eventsToCreate.length} events...\n`)

    // Insert events
    const { data: createdEvents, error: eventsError } = await supabase
      .from('events')
      .insert(eventsToCreate)
      .select()

    if (eventsError) {
      console.error('Error creating events:', eventsError)
      return
    }

    console.log(`✅ Successfully created ${createdEvents.length} events!\n`)

    // Display created events
    createdEvents.forEach((event, index) => {
      const startsAt = new Date(event.starts_at)
      console.log(`${index + 1}. ${event.game_name}`)
      console.log(`   Status: ${event.status}`)
      console.log(`   Date: ${startsAt.toLocaleDateString()} ${startsAt.toLocaleTimeString()}`)
      console.log(`   Time Slot: ${event.time_slot} (${event.day_slot})`)
      console.log(`   Votes: ${event.total_votes}`)
      console.log('')
    })

    // Optionally create some participants
    console.log('👥 Creating random participants...\n')

    // Get some user IDs (if any exist)
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(20)

    if (users && users.length > 0) {
      const participantsToCreate = []
      
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

        if (participantsError) {
          console.error('Error creating participants:', participantsError)
        } else {
          console.log(`✅ Created ${participantsToCreate.length} participant entries`)
        }
      }
    } else {
      console.log('⚠️  No users found, skipping participant creation')
    }

    console.log('\n✨ Seeding complete!')
  } catch (error) {
    console.error('\n❌ Error seeding events:', error)
    process.exit(1)
  }
}

seedEvents()


import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

const timeSlots = ['morning', 'noon', 'afternoon', 'evening', 'late_night']
const statuses = ['scheduled', 'ongoing']

// Helper to get a random date in the future
function getRandomFutureDate(daysFromNow: number = 0, daysRange: number = 30): Date {
  const now = new Date()
  const daysOffset = daysFromNow + Math.floor(Math.random() * daysRange)
  const date = new Date(now)
  date.setDate(date.getDate() + daysOffset)
  return date
}

// Helper to set time based on slot
function setTimeSlot(date: Date, timeSlot: string): Date {
  const times: Record<string, number> = {
    morning: 9,    // 09:00
    noon: 12,      // 12:00
    afternoon: 15, // 15:00
    evening: 18,   // 18:00
    late_night: 21, // 21:00
  }
  date.setHours(times[timeSlot] || 15, 0, 0, 0)
  return date
}

async function seedEvent() {
  console.log('\n🌱 Event Seeder\n')

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .order('username')

  if (usersError || !users || users.length === 0) {
    console.error('❌ No users found. Please create users first.')
    rl.close()
    return
  }

  console.log('\n👥 Available users:')
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.username} (${user.display_name || user.username})`)
  })

  const userIndexInput = await question(`\nSelect user (1-${users.length}): `)
  const userIndex = parseInt(userIndexInput.trim()) - 1

  if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) {
    console.error('❌ Invalid user selection')
    rl.close()
    return
  }

  const selectedUser = users[userIndex]
  console.log(`\n✅ Selected user: ${selectedUser.username}`)

  // Get game ID
  const gameId = await question('Game ID (SteamGridDB ID): ')
  if (!gameId || gameId.trim().length === 0) {
    console.error('❌ Game ID is required')
    rl.close()
    return
  }

  // Try to fetch game name
  let gameName = `Game ${gameId}`
  try {
    const response = await fetch(
      `https://www.steamgriddb.com/api/v2/games/id/${gameId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.STEAMGRIDDB_API_KEY || ''}`,
        },
      }
    )
    if (response.ok) {
      const data = await response.json()
      const game = Array.isArray(data.data) ? data.data[0] : data.data
      if (game?.name) {
        gameName = game.name
      }
    }
  } catch (error) {
    // Use placeholder name
  }

  console.log(`\n🎮 Game: ${gameName}`)

  // Get or create a weekly round
  console.log('\n📅 Checking for weekly round...')
  const { data: existingRounds } = await supabase
    .from('weekly_rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  let roundId: string
  if (existingRounds && existingRounds.length > 0) {
    roundId = existingRounds[0].id
    console.log(`✅ Using existing round: ${existingRounds[0].week_key}`)
  } else {
    // Create a new round
    const weekKey = `2025-W${Math.floor(Math.random() * 52) + 1}`
    const votingEndsAt = new Date()
    votingEndsAt.setDate(votingEndsAt.getDate() + 7)

    const { data: newRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .insert({
        week_key: weekKey,
        status: 'open',
        voting_ends_at: votingEndsAt.toISOString(),
      })
      .select()
      .single()

    if (roundError || !newRound) {
      console.error('❌ Error creating round:', roundError?.message)
      rl.close()
      return
    }

    roundId = newRound.id
    console.log(`✅ Created new round: ${weekKey}`)
  }

  // Get or create game event community
  console.log('\n🏘️  Checking for game event community...')
  let { data: community } = await supabase
    .from('game_event_communities')
    .select('*')
    .eq('game_id', gameId.trim())
    .single()

  if (!community) {
    const { data: newCommunity, error: communityError } = await supabase
      .from('game_event_communities')
      .insert({
        game_id: gameId.trim(),
        game_name: gameName,
        created_from_round_id: roundId,
      })
      .select()
      .single()

    if (communityError || !newCommunity) {
      console.error('❌ Error creating community:', communityError?.message)
      rl.close()
      return
    }

    community = newCommunity
    console.log('✅ Created game event community')
  } else {
    console.log('✅ Using existing game event community')
  }

  // Auto-generate event info
  console.log('\n🎲 Auto-generating event info...')
  
  const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  
  // Generate start time
  const startsAt = getRandomFutureDate(status === 'ongoing' ? -3 : 0, status === 'ongoing' ? 3 : 30)
  setTimeSlot(startsAt, timeSlot)
  
  // End time is 6 hours after start
  const endsAt = new Date(startsAt)
  endsAt.setHours(endsAt.getHours() + 6)

  // Random vote count
  const totalVotes = Math.floor(Math.random() * 50) + 5

  console.log(`   Time Slot: ${timeSlot}`)
  console.log(`   Status: ${status}`)
  console.log(`   Starts: ${startsAt.toLocaleString()}`)
  console.log(`   Ends: ${endsAt.toLocaleString()}`)
  console.log(`   Votes: ${totalVotes}`)

  // Create event
  console.log('\n📅 Creating event...')
  
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      game_id: gameId.trim(),
      game_name: gameName,
      community_id: community.id,
      round_id: roundId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      time_slot: timeSlot,
      status,
      total_votes: totalVotes,
    })
    .select()
    .single()

  if (eventError || !event) {
    console.error('❌ Error creating event:', eventError?.message)
    rl.close()
    return
  }

  console.log('✅ Event created successfully!')

  // Optionally add the user as a participant
  const addParticipantInput = await question('\nAdd user as participant? (y/n, default: y): ')
  if (addParticipantInput.trim().toLowerCase() !== 'n') {
    const { error: participantError } = await supabase
      .from('event_participants')
      .insert({
        event_id: event.id,
        user_id: selectedUser.id,
        status: 'in',
      })

    if (participantError) {
      console.error('⚠️  Error adding participant:', participantError.message)
    } else {
      console.log('✅ Added user as participant')
    }
  }

  console.log(`\n📋 Summary:`)
  console.log(`   Event ID: ${event.id}`)
  console.log(`   Game: ${gameName}`)
  console.log(`   Status: ${status}`)
  console.log(`   Time Slot: ${timeSlot}`)
  console.log(`   Starts: ${startsAt.toLocaleString()}`)
  console.log(`   Ends: ${endsAt.toLocaleString()}`)
  console.log(`   Votes: ${totalVotes}`)
  
  rl.close()
}

seedEvent().catch((error) => {
  console.error('\n❌ Error:', error)
  rl.close()
  process.exit(1)
})


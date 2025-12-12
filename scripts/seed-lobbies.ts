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

async function seedLobby() {
  console.log('\n🌱 Lobby Seeder\n')

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

  // Get lobby title
  const title = await question('Lobby Title (optional, press Enter for default): ')
  const lobbyTitle = title.trim() || `${gameName} Lobby`

  // Get description
  const description = await question('Description (optional, press Enter to skip): ')

  // Get platform
  console.log('\n📱 Platform options: pc, ps, xbox, switch, mobile, other')
  const platformInput = await question('Platform (default: pc): ')
  const platform = platformInput.trim() || 'pc'
  
  const validPlatforms = ['pc', 'ps', 'xbox', 'switch', 'mobile', 'other']
  if (!validPlatforms.includes(platform)) {
    console.error(`❌ Invalid platform. Must be one of: ${validPlatforms.join(', ')}`)
    rl.close()
    return
  }

  // Get max players
  const maxPlayersInput = await question('Max Players (optional, press Enter to skip): ')
  const maxPlayers = maxPlayersInput.trim() ? parseInt(maxPlayersInput.trim()) : null

  // Get Discord link
  const discordLink = await question('Discord Link (optional, press Enter to skip): ')

  // Get status
  console.log('\n📊 Status options: open, in_progress, closed')
  const statusInput = await question('Status (default: open): ')
  const status = statusInput.trim() || 'open'
  
  const validStatuses = ['open', 'in_progress', 'closed']
  if (!validStatuses.includes(status)) {
    console.error(`❌ Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    rl.close()
    return
  }

  // Create lobby
  console.log('\n🏠 Creating lobby...')
  
  const lobbyData: any = {
    host_id: selectedUser.id,
    game_id: gameId.trim(),
    game_name: gameName,
    title: lobbyTitle,
    platform,
    status,
  }

  if (description.trim()) lobbyData.description = description.trim()
  if (maxPlayers) lobbyData.max_players = maxPlayers
  if (discordLink.trim()) lobbyData.discord_link = discordLink.trim()

  const { data: lobby, error: lobbyError } = await supabase
    .from('lobbies')
    .insert(lobbyData)
    .select()
    .single()

  if (lobbyError || !lobby) {
    console.error('❌ Error creating lobby:', lobbyError?.message)
    rl.close()
    return
  }

  console.log('✅ Lobby created successfully!')
  console.log(`\n📋 Summary:`)
  console.log(`   Lobby ID: ${lobby.id}`)
  console.log(`   Host: ${selectedUser.username}`)
  console.log(`   Game: ${gameName}`)
  console.log(`   Title: ${lobbyTitle}`)
  console.log(`   Platform: ${platform}`)
  console.log(`   Status: ${status}`)
  if (maxPlayers) console.log(`   Max Players: ${maxPlayers}`)
  
  rl.close()
}

seedLobby().catch((error) => {
  console.error('\n❌ Error:', error)
  rl.close()
  process.exit(1)
})


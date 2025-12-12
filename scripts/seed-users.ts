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

async function seedUser() {
  console.log('\n🌱 User Seeder\n')
  console.log('This will create a user with profile, games, and optional pro subscription.\n')

  // Get username
  const username = await question('Username: ')
  if (!username || username.trim().length === 0) {
    console.error('❌ Username is required')
    rl.close()
    return
  }

  // Check if username exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .single()

  if (existingProfile) {
    console.error(`❌ Username "${username}" already exists`)
    rl.close()
    return
  }

  // Get display name
  const displayName = await question('Display Name (optional, press Enter to skip): ')
  
  // Get bio
  const bio = await question('Bio (optional, press Enter to skip): ')
  
  // Get avatar URL
  const avatarUrl = await question('Avatar URL (optional, press Enter to skip): ')
  
  // Get banner/cover URL
  const bannerUrl = await question('Banner/Cover URL (optional, press Enter to skip): ')
  
  // Get plan tier
  const planTierInput = await question('Plan Tier (free/pro, default: free): ')
  const planTier = planTierInput.trim().toLowerCase() === 'pro' ? 'pro' : 'free'
  
  // Get expiration date if pro
  let planExpiresAt: string | null = null
  if (planTier === 'pro') {
    const expiresInput = await question('Plan Expires At (YYYY-MM-DD or press Enter for 1 year from now): ')
    if (expiresInput.trim()) {
      planExpiresAt = new Date(expiresInput.trim()).toISOString()
    } else {
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      planExpiresAt = oneYearFromNow.toISOString()
    }
  }

  // Get games to add
  console.log('\n📚 Games to add:')
  console.log('   Enter game IDs (SteamGridDB IDs) separated by commas, or press Enter to skip')
  const gamesInput = await question('Game IDs (e.g., 730,1234,5678): ')
  
  const gameIds: string[] = []
  if (gamesInput.trim()) {
    gameIds.push(...gamesInput.split(',').map(id => id.trim()).filter(Boolean))
  }

  // Create auth user first
  const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
  const password = 'TempPassword123!'
  
  console.log('\n🔐 Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: username.trim(),
      display_name: displayName.trim() || username.trim(),
    },
  })

  if (authError || !authData.user) {
    console.error('❌ Error creating auth user:', authError?.message)
    rl.close()
    return
  }

  const userId = authData.user.id
  console.log(`✅ Auth user created: ${email}`)

  // Update profile with custom fields
  console.log('\n👤 Creating profile...')
  const profileUpdate: any = {
    username: username.trim(),
    display_name: displayName.trim() || username.trim(),
    plan_tier: planTier,
  }

  if (bio.trim()) profileUpdate.bio = bio.trim()
  if (avatarUrl.trim()) profileUpdate.avatar_url = avatarUrl.trim()
  if (bannerUrl.trim()) profileUpdate.banner_url = bannerUrl.trim()
  if (planExpiresAt) profileUpdate.plan_expires_at = planExpiresAt

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId)

  if (profileError) {
    console.error('❌ Error updating profile:', profileError.message)
    rl.close()
    return
  }

  console.log('✅ Profile created/updated')

  // Add games to user library
  if (gameIds.length > 0) {
    console.log(`\n🎮 Adding ${gameIds.length} games to library...`)
    
    // Fetch game names from SteamGridDB (or use placeholder)
    const gamesToAdd = await Promise.all(
      gameIds.map(async (gameId) => {
        try {
          // Try to fetch game name from API
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
            return { game_id: gameId, game_name: game?.name || `Game ${gameId}` }
          }
        } catch (error) {
          // Ignore errors, use placeholder
        }
        return { game_id: gameId, game_name: `Game ${gameId}` }
      })
    )

    const userGames = gamesToAdd.map(({ game_id, game_name }) => ({
      user_id: userId,
      game_id,
      game_name,
    }))

    const { error: gamesError } = await supabase
      .from('user_games')
      .insert(userGames)

    if (gamesError) {
      console.error('⚠️  Error adding games:', gamesError.message)
    } else {
      console.log(`✅ Added ${userGames.length} games to library`)
    }
  }

  console.log('\n✨ User seeding complete!')
  console.log(`\n📋 Summary:`)
  console.log(`   Username: ${username}`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   Plan: ${planTier}${planExpiresAt ? ` (expires: ${new Date(planExpiresAt).toLocaleDateString()})` : ''}`)
  console.log(`   Games: ${gameIds.length}`)
  
  rl.close()
}

seedUser().catch((error) => {
  console.error('\n❌ Error:', error)
  rl.close()
  process.exit(1)
})


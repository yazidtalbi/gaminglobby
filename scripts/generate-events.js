require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateEvents() {
  try {
    console.log('Looking for locked round to process...')
    
    // Get the most recent locked round
    const { data: lockedRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'locked')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError || !lockedRound) {
      console.log('❌ No locked round found.')
      return
    }

    console.log(`\n📋 Found locked round: ${lockedRound.week_key} (ID: ${lockedRound.id})`)

    // Call the API to generate events
    console.log('\n🎮 Generating events from top 3 candidates...')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/events/generate-from-round`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE || '', // You may need to pass auth cookie
      },
      body: JSON.stringify({ round_id: lockedRound.id, top_n: 3 }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`\n✅ Successfully generated ${data.events?.length || 0} events`)
      if (data.newRound) {
        console.log(`\n✅ Created new round: ${data.newRound.week_key}`)
      }
      if (data.events && data.events.length > 0) {
        console.log('\n📅 Generated events:')
        data.events.forEach((e, i) => {
          console.log(`   ${i + 1}. ${e.game_name} - ${e.day_slot} ${e.time_slot} (${new Date(e.starts_at).toLocaleString()})`)
        })
      }
    } else {
      const error = await response.text()
      console.error('\n❌ Error generating events:', error)
      console.log('\n💡 Make sure the dev server is running (npm run dev)')
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Make sure the dev server is running (npm run dev)')
  }
}

generateEvents()


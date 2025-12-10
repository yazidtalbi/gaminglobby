require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function endWeeklyVote() {
  try {
    console.log('Looking for open weekly round...')
    
    // Get the current open round
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError) {
      if (roundError.code === 'PGRST116') {
        console.log('❌ No open round found.')
        return
      }
      throw roundError
    }

    if (!currentRound) {
      console.log('❌ No open round found.')
      return
    }

    console.log(`\n📋 Found open round:`)
    console.log(`   Week: ${currentRound.week_key}`)
    console.log(`   ID: ${currentRound.id}`)
    console.log(`   Created: ${new Date(currentRound.created_at).toLocaleString()}`)

    // Lock the round
    console.log('\n🔒 Locking round...')
    const { error: updateError } = await supabase
      .from('weekly_rounds')
      .update({
        status: 'locked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRound.id)

    if (updateError) {
      throw updateError
    }

    console.log(`\n✅ Successfully locked round: ${currentRound.week_key}`)
    console.log('\n🎮 Generating events from top 3 candidates...')
    
    // Generate events from top 3 candidates
    try {
      const { data: allCandidates } = await supabase
        .from('weekly_game_candidates')
        .select('*')
        .eq('round_id', currentRound.id)

      // Recalculate votes
      const candidatesWithVotes = await Promise.all(
        (allCandidates || []).map(async (candidate) => {
          const { count } = await supabase
            .from('weekly_game_votes')
            .select('*', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id)
          return { ...candidate, total_votes: count || 0 }
        })
      )

      const top3 = candidatesWithVotes
        .sort((a, b) => b.total_votes - a.total_votes)
        .slice(0, 3)

      console.log(`\n📊 Top 3 candidates:`)
      top3.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.game_name} (${c.total_votes} votes)`)
      })

      // Call the API to generate events (requires server to be running)
      console.log('\n💡 To generate events, call: POST /api/events/generate-from-round')
      console.log('   Or use the lock endpoint: POST /api/events/rounds/lock')
    } catch (error) {
      console.error('Error calculating top candidates:', error.message)
    }
  } catch (error) {
    console.error('\n❌ Error ending weekly vote:', error.message)
    process.exit(1)
  }
}

endWeeklyVote()


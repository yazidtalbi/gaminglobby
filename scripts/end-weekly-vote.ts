import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function endWeeklyVote() {
  try {
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
        console.log('No open round found.')
        return
      }
      throw roundError
    }

    if (!currentRound) {
      console.log('No open round found.')
      return
    }

    console.log(`Found open round: ${currentRound.week_key} (ID: ${currentRound.id})`)

    // Lock the round
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

    console.log(`✅ Successfully locked round: ${currentRound.week_key}`)
    console.log('Voting is now closed. Use /api/events/generate-from-round to create events from top candidates.')
  } catch (error) {
    console.error('Error ending weekly vote:', error)
    process.exit(1)
  }
}

endWeeklyVote()


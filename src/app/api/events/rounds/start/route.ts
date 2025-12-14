import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Generate week key in format "YYYY-Www" (ISO week)
 */
function getWeekKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  
  // Get ISO week number
  // ISO weeks start on Monday, week 1 is the first week with a Thursday
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7 // Convert Sunday (0) to 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum) // Get Thursday of current week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  
  return `${year}-W${weekNo.toString().padStart(2, '0')}`
}

/**
 * Get voting end date (7 days from now, end of day)
 */
function getVotingEndDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is founder
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (profile.plan_tier !== 'founder') {
      return NextResponse.json({ error: 'Only founders can start weekly votes' }, { status: 403 })
    }

    // Check if there's already an open round
    const { data: existingRound, error: checkError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'open')
      .limit(1)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check existing rounds' }, { status: 500 })
    }

    if (existingRound) {
      return NextResponse.json(
        { error: `There is already an open round: ${existingRound.week_key}` },
        { status: 400 }
      )
    }

    // Generate week key and voting end date
    const weekKey = getWeekKey()
    const votingEndsAt = getVotingEndDate()

    // Create new round
    const { data: newRound, error: createError } = await supabase
      .from('weekly_rounds')
      .insert({
        week_key: weekKey,
        status: 'open',
        voting_ends_at: votingEndsAt,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating round:', createError)
      return NextResponse.json({ error: 'Failed to create new round' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully started new weekly vote: ${weekKey}`,
      round: newRound,
    })
  } catch (error) {
    console.error('Unexpected error starting weekly vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

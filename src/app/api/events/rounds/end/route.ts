import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ error: 'Only founders can end weekly votes' }, { status: 403 })
    }

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
        return NextResponse.json({ error: 'No open round found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch current round' }, { status: 500 })
    }

    if (!currentRound) {
      return NextResponse.json({ error: 'No open round found' }, { status: 404 })
    }

    // Lock the round
    const { error: updateError } = await supabase
      .from('weekly_rounds')
      .update({
        status: 'locked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRound.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to lock round' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully locked round: ${currentRound.week_key}`,
      round: currentRound,
    })
  } catch (error) {
    console.error('Unexpected error ending weekly vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

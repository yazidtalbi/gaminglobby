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

    // Get top 3 candidates by vote count
    const { data: topCandidates, error: candidatesError } = await supabase
      .from('weekly_game_candidates')
      .select('*')
      .eq('round_id', currentRound.id)
      .order('total_votes', { ascending: false })
      .limit(3)

    if (candidatesError) {
      return NextResponse.json({ error: 'Failed to fetch top candidates' }, { status: 500 })
    }

    if (!topCandidates || topCandidates.length === 0) {
      return NextResponse.json({ error: 'No candidates found for this round' }, { status: 400 })
    }

    // Use all candidates if less than 3, otherwise use top 3
    const candidatesToUse = topCandidates.length >= 3 
      ? topCandidates.slice(0, 3) 
      : topCandidates

    // Set selection phase deadline (1 day from now)
    const selectionDeadline = new Date()
    selectionDeadline.setDate(selectionDeadline.getDate() + 1)

    // Lock the round and set selection phase
    const { data: updatedRound, error: updateError } = await supabase
      .from('weekly_rounds')
      .update({
        status: 'locked',
        selection_phase_deadline: selectionDeadline.toISOString(),
        selection_phase_completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRound.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating round status:', updateError)
      return NextResponse.json({ 
        error: 'Failed to lock round', 
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    if (!updatedRound) {
      console.error('Round update returned no data')
      return NextResponse.json({ error: 'Round update failed - no data returned' }, { status: 500 })
    }

    console.log('Round successfully locked:', {
      id: updatedRound.id,
      status: updatedRound.status,
      selection_phase_deadline: updatedRound.selection_phase_deadline,
    })

    // Create selection entries for top games (up to 3, or all if less than 3)
    const selections = candidatesToUse.map(candidate => ({
      round_id: currentRound.id,
      candidate_id: candidate.id,
      game_id: candidate.game_id,
      game_name: candidate.game_name,
      selection_deadline: selectionDeadline.toISOString(),
      events_created: false,
    }))

    const { error: insertError } = await supabase
      .from('weekly_game_selections')
      .insert(selections)

    if (insertError) {
      console.error('Error creating selections:', insertError)
      // Check if table doesn't exist (migration not run)
      if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Selection table not found. Please run the database migration: 013_add_game_selection_phase.sql',
          details: insertError.message 
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'Failed to create selection phase', 
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully locked round and started selection phase: ${currentRound.week_key}`,
      round: {
        ...currentRound,
        status: 'locked',
        selection_phase_deadline: selectionDeadline.toISOString(),
      },
      topCandidates: candidatesToUse.map(c => ({
        id: c.id,
        game_id: c.game_id,
        game_name: c.game_name,
        total_votes: c.total_votes,
      })),
      selectionsCreated: selections.length,
    })
  } catch (error) {
    console.error('Unexpected error ending weekly vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

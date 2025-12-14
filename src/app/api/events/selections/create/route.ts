import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Manually create selections for a locked round (helper endpoint)
 * POST /api/events/selections/create
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is founder
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    if (profile?.plan_tier !== 'founder') {
      return NextResponse.json({ error: 'Only founders can create selections' }, { status: 403 })
    }

    // Get the current locked round
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'locked')
      .eq('selection_phase_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (roundError || !currentRound) {
      return NextResponse.json({ error: 'No locked round found' }, { status: 404 })
    }

    // Check if selections already exist
    const { data: existingSelections } = await supabase
      .from('weekly_game_selections')
      .select('id')
      .eq('round_id', currentRound.id)

    if (existingSelections && existingSelections.length > 0) {
      return NextResponse.json({ 
        error: 'Selections already exist for this round',
        count: existingSelections.length 
      }, { status: 400 })
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

    // Set selection phase deadline (1 day from now, or use existing if set)
    const selectionDeadline = currentRound.selection_phase_deadline 
      ? new Date(currentRound.selection_phase_deadline)
      : (() => {
          const deadline = new Date()
          deadline.setDate(deadline.getDate() + 1)
          return deadline
        })()

    // Update round if deadline wasn't set
    if (!currentRound.selection_phase_deadline) {
      await supabase
        .from('weekly_rounds')
        .update({
          selection_phase_deadline: selectionDeadline.toISOString(),
          selection_phase_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRound.id)
    }

    // Create selection entries for top 3 games
    const selections = topCandidates.map(candidate => ({
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
      if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Selection table not found. Please run the database migration: 013_add_game_selection_phase.sql',
          details: insertError.message 
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'Failed to create selections', 
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${selections.length} selection(s)`,
      selections: selections.map(s => ({
        game_id: s.game_id,
        game_name: s.game_name,
      })),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

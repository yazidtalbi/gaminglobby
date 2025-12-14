import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/events/selections/current - Get current selection phase data
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current locked round with selection phase
    const { data: currentRound, error: roundError } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'locked')
      .eq('selection_phase_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (roundError) {
      console.error('Error fetching locked round:', roundError)
      return NextResponse.json({ error: 'Failed to fetch round', details: roundError.message }, { status: 500 })
    }

    if (!currentRound) {
      return NextResponse.json({ round: null, selections: [], deadlinePassed: false })
    }

    // Check if selection deadline has passed
    const deadlinePassed = currentRound.selection_phase_deadline && 
      new Date(currentRound.selection_phase_deadline) < new Date()

    // Get selections for this round
    const { data: selections, error: selectionsError } = await supabase
      .from('weekly_game_selections')
      .select('*')
      .eq('round_id', currentRound.id)
      .order('created_at', { ascending: true })

    if (selectionsError) {
      console.error('Error fetching selections:', selectionsError)
      // If table doesn't exist, return empty array (migration not run)
      if (selectionsError.code === '42P01' || selectionsError.message?.includes('does not exist')) {
        console.warn('weekly_game_selections table does not exist. Please run migration 013_add_game_selection_phase.sql')
        return NextResponse.json({ 
          round: currentRound, 
          selections: [], 
          userVotes: {},
          deadlinePassed,
          error: 'Selection table not found. Please run the database migration.' 
        })
      }
      return NextResponse.json({ error: 'Failed to fetch selections', details: selectionsError.message }, { status: 500 })
    }

    if (!selections || selections.length === 0) {
      console.warn(`No selections found for round ${currentRound.id}. Selections may not have been created when vote ended.`)
      // Still return the round so the UI can show the selection phase with a helpful message
      return NextResponse.json({
        round: currentRound,
        selections: [],
        userVotes: {},
        deadlinePassed,
        warning: 'No selections found. The selections may not have been created when the vote ended. As a founder, you can create them manually using the button below.',
      })
    }

    // Get user's votes if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    const userVotes: Record<string, { day_pref: string; time_pref: string }> = {}

    if (user && selections && selections.length > 0) {
      const selectionIds = selections.map(s => s.id)
      const { data: votes } = await supabase
        .from('weekly_game_selection_votes')
        .select('selection_id, day_pref, time_pref')
        .eq('user_id', user.id)
        .in('selection_id', selectionIds)

      votes?.forEach(vote => {
        userVotes[vote.selection_id] = {
          day_pref: vote.day_pref,
          time_pref: vote.time_pref,
        }
      })
    }

    // Get vote counts for each selection (for display)
    const selectionsWithStats = await Promise.all(
      (selections || []).map(async (selection) => {
        const { count } = await supabase
          .from('weekly_game_selection_votes')
          .select('*', { count: 'exact', head: true })
          .eq('selection_id', selection.id)

        // Get day/time distribution
        const { data: allVotes } = await supabase
          .from('weekly_game_selection_votes')
          .select('day_pref, time_pref')
          .eq('selection_id', selection.id)

        const dayDistribution: Record<string, number> = {}
        const timeDistribution: Record<string, number> = {}

        allVotes?.forEach(vote => {
          dayDistribution[vote.day_pref] = (dayDistribution[vote.day_pref] || 0) + 1
          timeDistribution[vote.time_pref] = (timeDistribution[vote.time_pref] || 0) + 1
        })

        return {
          ...selection,
          vote_count: count || 0,
          day_distribution: dayDistribution,
          time_distribution: timeDistribution,
        }
      })
    )

    return NextResponse.json({
      round: currentRound,
      selections: selectionsWithStats,
      userVotes,
      deadlinePassed,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/withdraw - Withdraw from tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const tournamentId = params.id

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('status')
      .eq('id', tournamentId)
      .single()

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Can't withdraw if tournament has started
    if (tournament.status === 'in_progress' || tournament.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot withdraw from tournament in progress' },
        { status: 400 }
      )
    }

    // Update participant status
    const { error: updateError } = await supabase
      .from('tournament_participants')
      .update({ status: 'withdrawn' })
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error withdrawing:', updateError)
      return NextResponse.json(
        { error: 'Failed to withdraw from tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully withdrew from tournament',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

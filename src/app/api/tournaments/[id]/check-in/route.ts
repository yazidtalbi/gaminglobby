import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/check-in - Check in for tournament
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
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('check_in_required, check_in_deadline, status')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    if (!tournament.check_in_required) {
      return NextResponse.json(
        { error: 'Check-in is not required for this tournament' },
        { status: 400 }
      )
    }

    // Check check-in deadline
    if (new Date(tournament.check_in_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Check-in deadline has passed' },
        { status: 400 }
      )
    }

    // Get participant
    const { data: participant, error: participantError } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Not registered for this tournament' },
        { status: 400 }
      )
    }

    if (participant.status === 'checked_in') {
      return NextResponse.json(
        { error: 'Already checked in' },
        { status: 400 }
      )
    }

    if (participant.status === 'withdrawn') {
      return NextResponse.json(
        { error: 'Cannot check in after withdrawing' },
        { status: 400 }
      )
    }

    // Check in
    const { data: updated, error: checkInError } = await supabase
      .from('tournament_participants')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', participant.id)
      .select()
      .single()

    if (checkInError) {
      console.error('Error checking in:', checkInError)
      return NextResponse.json(
        { error: 'Failed to check in' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      participant: updated,
      message: 'Successfully checked in',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

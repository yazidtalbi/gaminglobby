import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/register - Register for tournament
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
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if registration is open
    if (tournament.status !== 'open') {
      return NextResponse.json(
        { error: 'Tournament registration is not open' },
        { status: 400 }
      )
    }

    // Check registration deadline
    if (new Date(tournament.registration_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered for this tournament' },
        { status: 400 }
      )
    }

    // Check if tournament is full
    if (tournament.current_participants >= tournament.max_participants) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      )
    }

    // Register
    const { data: participant, error: registerError } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id,
        status: 'registered',
      })
      .select()
      .single()

    if (registerError) {
      console.error('Error registering:', registerError)
      return NextResponse.json(
        { error: 'Failed to register for tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      participant,
      message: 'Successfully registered for tournament',
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

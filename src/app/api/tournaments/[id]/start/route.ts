import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateSingleEliminationBracket } from '@/lib/tournaments/bracket'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/start - Start tournament and generate bracket (host only)
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

    // Check if user is host
    if (tournament.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only tournament host can start the tournament' },
        { status: 403 }
      )
    }

    // Check tournament status
    if (tournament.status !== 'open' && tournament.status !== 'registration_closed') {
      return NextResponse.json(
        { error: 'Tournament cannot be started in current status' },
        { status: 400 }
      )
    }

    // Get checked-in participants
    const { data: participants, error: participantsError } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'checked_in')
      .order('created_at', { ascending: true })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    const checkedInCount = participants?.length || 0

    // Must have exactly 8 or 16 checked-in participants
    if (checkedInCount !== 8 && checkedInCount !== 16) {
      return NextResponse.json(
        { 
          error: `Tournament requires exactly 8 or 16 checked-in participants. Currently: ${checkedInCount}`,
          checked_in_count: checkedInCount,
        },
        { status: 400 }
      )
    }

    // Generate bracket
    const bracket = generateSingleEliminationBracket(participants!, tournamentId)

    // Create all matches in database
    const matchesToInsert = bracket.rounds.flatMap(round =>
      round.matches.map(match => ({
        tournament_id: tournamentId,
        round_number: match.round_number,
        match_number: match.match_number,
        participant1_id: match.participant1_id,
        participant2_id: match.participant2_id,
        status: 'pending',
      }))
    )

    const { error: matchesError } = await supabase
      .from('tournament_matches')
      .insert(matchesToInsert)

    if (matchesError) {
      console.error('Error creating matches:', matchesError)
      return NextResponse.json(
        { error: 'Failed to create bracket matches' },
        { status: 500 }
      )
    }

    // Update tournament status
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)

    if (updateError) {
      console.error('Error updating tournament:', updateError)
      return NextResponse.json(
        { error: 'Failed to start tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tournament started successfully',
      bracket,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

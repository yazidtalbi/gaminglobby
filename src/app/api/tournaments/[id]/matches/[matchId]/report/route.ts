import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { submitMatchReportSchema } from '@/lib/tournaments/validation'

export const dynamic = 'force-dynamic'

// POST /api/tournaments/[id]/matches/[matchId]/report - Submit match report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const tournamentId = params.id
    const matchId = params.matchId

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .eq('tournament_id', tournamentId)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if match is already finalized
    if (match.status === 'completed') {
      return NextResponse.json(
        { error: 'Match already finalized' },
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
        { error: 'Not a participant in this tournament' },
        { status: 400 }
      )
    }

    // Verify participant is in this match
    if (participant.id !== match.participant1_id && participant.id !== match.participant2_id) {
      return NextResponse.json(
        { error: 'Not a participant in this match' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = submitMatchReportSchema.parse(body)

    // Verify claimed winner is a participant in the match
    if (validated.claimed_winner_participant_id !== match.participant1_id && 
        validated.claimed_winner_participant_id !== match.participant2_id) {
      return NextResponse.json(
        { error: 'Claimed winner must be a participant in this match' },
        { status: 400 }
      )
    }

    // Check if report already exists
    const { data: existing } = await supabase
      .from('tournament_match_reports')
      .select('id')
      .eq('match_id', matchId)
      .eq('reporter_user_id', user.id)
      .single()

    let report

    if (existing) {
      // Update existing report
      const { data: updated, error: updateError } = await supabase
        .from('tournament_match_reports')
        .update({
          claimed_winner_participant_id: validated.claimed_winner_participant_id,
          claimed_score1: validated.claimed_score1,
          claimed_score2: validated.claimed_score2,
          claimed_method: validated.claimed_method || 'manual',
          notes: validated.notes || null,
          proof_paths: validated.proof_paths,
          status: 'submitted',
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating report:', updateError)
        return NextResponse.json(
          { error: 'Failed to update match report' },
          { status: 500 }
        )
      }

      report = updated
    } else {
      // Create new report
      const { data: created, error: createError } = await supabase
        .from('tournament_match_reports')
        .insert({
          tournament_id: tournamentId,
          match_id: matchId,
          reporter_participant_id: participant.id,
          reporter_user_id: user.id,
          claimed_winner_participant_id: validated.claimed_winner_participant_id,
          claimed_score1: validated.claimed_score1,
          claimed_score2: validated.claimed_score2,
          claimed_method: validated.claimed_method || 'manual',
          notes: validated.notes || null,
          proof_paths: validated.proof_paths,
          status: 'submitted',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating report:', createError)
        return NextResponse.json(
          { error: 'Failed to submit match report' },
          { status: 500 }
        )
      }

      report = created
    }

    // Update match status to in_progress if not already
    if (match.status === 'pending') {
      await supabase
        .from('tournament_matches')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId)
    }

    return NextResponse.json({
      report,
      message: 'Match report submitted successfully',
    }, { status: existing ? 200 : 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/tournaments/[id]/matches/[matchId]/reports - Get match reports
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const tournamentId = params.id
    const matchId = params.matchId

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tournament to verify access
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', tournamentId)
      .single()

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Only host can view reports
    if (tournament.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only tournament host can view match reports' },
        { status: 403 }
      )
    }

    // Get reports
    const { data: reports, error } = await supabase
      .from('tournament_match_reports')
      .select(`
        *,
        reporter:profiles!tournament_match_reports_reporter_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('match_id', matchId)
      .eq('status', 'submitted')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch match reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports: reports || [],
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

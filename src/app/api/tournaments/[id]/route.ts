import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TournamentWithHost, TournamentParticipant, TournamentMatch } from '@/types/tournaments'

export const dynamic = 'force-dynamic'

// GET /api/tournaments/[id] - Get tournament details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const tournamentId = params.id

    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        *,
        host:profiles!tournaments_host_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Get participants
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        profile:profiles!tournament_participants_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true })

    // Get matches
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        participant1:tournament_participants!tournament_matches_participant1_id_fkey(
          *,
          profile:profiles!tournament_participants_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        ),
        participant2:tournament_participants!tournament_matches_participant2_id_fkey(
          *,
          profile:profiles!tournament_participants_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        ),
        winner:tournament_participants!tournament_matches_winner_id_fkey(
          *,
          profile:profiles!tournament_participants_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })

    // Get user participation (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()
    let userParticipation = null

    if (user) {
      const { data: participation } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .single()

      userParticipation = participation
        ? {
            is_registered: true,
            is_checked_in: participation.status === 'checked_in',
            status: participation.status,
          }
        : {
            is_registered: false,
            is_checked_in: false,
            status: null,
          }
    }

    return NextResponse.json({
      tournament: tournament as TournamentWithHost,
      participants: (participants || []) as TournamentParticipant[],
      matches: (matches || []) as TournamentMatch[],
      user_participation: userParticipation,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

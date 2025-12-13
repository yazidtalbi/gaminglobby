import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createTournamentSchema } from '@/lib/tournaments/validation'
import { TournamentWithHost } from '@/types/tournaments'

export const dynamic = 'force-dynamic'

// GET /api/tournaments - List tournaments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    const status = searchParams.get('status')
    const gameId = searchParams.get('game_id')
    const platform = searchParams.get('platform')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('tournaments')
      .select(`
        *,
        host:profiles!tournaments_host_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (gameId) {
      query = query.eq('game_id', gameId)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching tournaments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tournaments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tournaments: (data || []) as TournamentWithHost[],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments - Create tournament (Pro only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is Pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier, plan_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const isPro = profile.plan_tier === 'pro' || profile.plan_tier === 'founder'
    const isProActive = isPro && (
      !profile.plan_expires_at || 
      new Date(profile.plan_expires_at) > new Date()
    )

    if (!isProActive) {
      return NextResponse.json(
        { error: 'Pro subscription required to create tournaments', code: 'PREMIUM_REQUIRED' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createTournamentSchema.parse(body)

    // Validate dates
    const now = new Date()
    const startAt = new Date(validated.start_at)
    const regDeadline = new Date(validated.registration_deadline)
    const checkInDeadline = validated.check_in_required
      ? new Date(validated.check_in_deadline)
      : null

    if (regDeadline >= startAt) {
      return NextResponse.json(
        { error: 'Registration deadline must be before start time' },
        { status: 400 }
      )
    }

    if (validated.check_in_required && checkInDeadline) {
      if (checkInDeadline >= startAt || checkInDeadline <= regDeadline) {
        return NextResponse.json(
          { error: 'Check-in deadline must be between registration deadline and start time' },
          { status: 400 }
        )
      }
    }

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        host_id: user.id,
        ...validated,
        status: 'open',
        current_participants: 0,
      })
      .select(`
        *,
        host:profiles!tournaments_host_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating tournament:', error)
      return NextResponse.json(
        { error: 'Failed to create tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tournament: tournament as TournamentWithHost,
      message: 'Tournament created successfully',
    }, { status: 201 })
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

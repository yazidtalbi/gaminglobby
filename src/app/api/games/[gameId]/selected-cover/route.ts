import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET: Fetch the selected cover for a game
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('game_selected_covers')
      .select('selected_cover_url, selected_cover_thumb')
      .eq('game_id', gameId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error fetching selected cover:', error)
      return NextResponse.json({ error: 'Failed to fetch selected cover' }, { status: 500 })
    }

    return NextResponse.json({
      coverUrl: data?.selected_cover_url || null,
      coverThumb: data?.selected_cover_thumb || null,
    })
  } catch (error) {
    console.error('Selected cover fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch selected cover' }, { status: 500 })
  }
}

// POST: Save the selected cover for a game (founders only)
export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }

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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.plan_tier !== 'founder') {
      return NextResponse.json({ error: 'Only founders can select covers' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { coverUrl, coverThumb } = body

    if (!coverUrl || !coverThumb) {
      return NextResponse.json({ error: 'coverUrl and coverThumb are required' }, { status: 400 })
    }

    // Upsert the selected cover
    const { data, error } = await supabase
      .from('game_selected_covers')
      .upsert({
        game_id: gameId,
        selected_cover_url: coverUrl,
        selected_cover_thumb: coverThumb,
        selected_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'game_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving selected cover:', error)
      return NextResponse.json({ error: 'Failed to save selected cover' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Selected cover save error:', error)
    return NextResponse.json({ error: 'Failed to save selected cover' }, { status: 500 })
  }
}

// DELETE: Remove the selected cover for a game (founders only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
  }

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
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.plan_tier !== 'founder') {
      return NextResponse.json({ error: 'Only founders can remove selected covers' }, { status: 403 })
    }

    // Delete the selected cover
    const { error } = await supabase
      .from('game_selected_covers')
      .delete()
      .eq('game_id', gameId)

    if (error) {
      console.error('Error deleting selected cover:', error)
      return NextResponse.json({ error: 'Failed to delete selected cover' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Selected cover delete error:', error)
    return NextResponse.json({ error: 'Failed to delete selected cover' }, { status: 500 })
  }
}

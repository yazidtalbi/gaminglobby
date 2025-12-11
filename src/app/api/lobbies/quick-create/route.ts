import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isPro } from '@/lib/premium'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, gameName, platform, userId, autoInviteEnabled } = body

    if (!gameId || !gameName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If platform is not provided, get preferred platform from profile
    let selectedPlatform = platform
    if (!selectedPlatform) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_platform')
        .eq('id', userId)
        .single()
      
      selectedPlatform = profile?.preferred_platform || 'pc'
    }

    if (!selectedPlatform) {
      return NextResponse.json(
        { error: 'Platform is required. Please set a preferred platform in settings.' },
        { status: 400 }
      )
    }

    // Close any existing lobbies the user is hosting
    await supabase
      .from('lobbies')
      .update({ status: 'closed' })
      .eq('host_id', userId)
      .in('status', ['open', 'in_progress'])

    // Leave any lobbies the user is a member of
    const { data: existingMembership } = await supabase
      .from('lobby_members')
      .select(`
        id,
        lobby:lobbies!inner(id, status)
      `)
      .eq('user_id', userId)

    const activeMemberships = existingMembership?.filter(
      (m) => {
        const lobby = m.lobby as unknown as { status: string }
        return lobby.status === 'open' || lobby.status === 'in_progress'
      }
    )

    if (activeMemberships && activeMemberships.length > 0) {
      const membershipIds = activeMemberships.map((m) => m.id)
      await supabase
        .from('lobby_members')
        .delete()
        .in('id', membershipIds)
    }

    // Verify Pro status if auto-invite is requested
    if (autoInviteEnabled) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_tier, plan_expires_at')
        .eq('id', userId)
        .single()

      if (!isPro(profile)) {
        return NextResponse.json(
          { error: 'Pro subscription required for auto-invite feature' },
          { status: 403 }
        )
      }
    }

    // Create quick lobby with dummy title and 2 max players
    const { data: lobby, error: insertError } = await supabase
      .from('lobbies')
      .insert({
        host_id: userId,
        game_id: gameId,
        game_name: gameName,
        title: 'Quick Matchmaking',
        description: null,
        platform: selectedPlatform,
        max_players: 2,
        discord_link: null,
        featured_guide_id: null,
        status: 'open',
        host_last_active_at: new Date().toISOString(),
        auto_invite_enabled: autoInviteEnabled || false,
        visibility: 'public',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating quick lobby:', insertError)
      return NextResponse.json(
        { error: 'Failed to create lobby' },
        { status: 500 }
      )
    }

    // Automatically add host to lobby_members
    await supabase.from('lobby_members').insert({
      lobby_id: lobby.id,
      user_id: userId,
      role: 'host',
      ready: false,
    })

    // Automatically add game to user's library if not already present
    try {
      const { data: existingGames } = await supabase
        .from('user_games')
        .select('id')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .limit(1)

      if (!existingGames || existingGames.length === 0) {
        await supabase.from('user_games').insert({
          user_id: userId,
          game_id: gameId,
          game_name: gameName,
        })
      }
    } catch (error) {
      // Silently fail - non-critical
      console.log('Could not auto-add game to library:', error)
    }

    return NextResponse.json({ lobbyId: lobby.id })
  } catch (error) {
    console.error('Error in quick create lobby API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


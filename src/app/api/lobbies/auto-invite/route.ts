import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/premium'

/**
 * Auto-invite online players who have the game in their library
 * Premium feature: Only Pro users can use this
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier, plan_expires_at')
      .eq('id', user.id)
      .single()

    const isProUser = profile && (
      (profile.plan_tier === 'pro' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ||
      profile.plan_tier === 'founder'
    )
    if (!isProUser) {
      return NextResponse.json(
        { error: 'Pro subscription required for auto-invite feature' },
        { status: 403 }
      )
    }

    const { lobbyId, gameId, minutesThreshold = 15 } = await request.json()

    if (!lobbyId || !gameId) {
      return NextResponse.json(
        { error: 'lobbyId and gameId are required' },
        { status: 400 }
      )
    }

    // Verify lobby ownership
    const { data: lobby } = await supabase
      .from('lobbies')
      .select('host_id, auto_invite_enabled')
      .eq('id', lobbyId)
      .single()

    if (!lobby || lobby.host_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Enable auto-invite if not already enabled (premium feature)
    if (!lobby.auto_invite_enabled) {
      await supabase
        .from('lobbies')
        .update({ auto_invite_enabled: true })
        .eq('id', lobbyId)
    }

    // Find online users who have this game in their library
    const thresholdTime = new Date()
    thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesThreshold)

    // First, get all users who have this game
    const { data: userGames, error: gamesError } = await supabase
      .from('user_games')
      .select('user_id')
      .eq('game_id', gameId)
      .neq('user_id', user.id) // Don't invite yourself

    if (gamesError) {
      console.error('Error fetching user games:', gamesError)
      return NextResponse.json(
        { error: 'Failed to fetch eligible users' },
        { status: 500 }
      )
    }

    if (!userGames || userGames.length === 0) {
      return NextResponse.json({ 
        invited: 0,
        message: 'No eligible users found' 
      })
    }

    const userIds = userGames.map(ug => ug.user_id)

    // Then, get profiles for these users who are online and allow invites
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, last_active_at, allow_invites, invites_from_followers_only')
      .in('id', userIds)
      .gte('last_active_at', thresholdTime.toISOString())
      .eq('allow_invites', true)

    if (usersError) {
      console.error('Error fetching eligible users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch eligible users' },
        { status: 500 }
      )
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return NextResponse.json({ 
        invited: 0,
        message: 'No eligible users found' 
      })
    }

    // Filter based on invite preferences
    const usersToInvite = eligibleUsers.filter((profile) => {
      // If user only accepts invites from followers, check follow relationship
      if (profile.invites_from_followers_only) {
        // This would need a follow check - simplified for now
        // In production, you'd check the follows table
        return false // Skip for now, can be enhanced
      }
      
      return true
    })

    // Check for existing invites to avoid duplicates
    const userIdsToInvite = usersToInvite.map((profile) => profile.id)
    const { data: existingInvites } = await supabase
      .from('lobby_invites')
      .select('to_user_id')
      .eq('lobby_id', lobbyId)
      .in('to_user_id', userIdsToInvite)
      .in('status', ['pending', 'accepted'])

    const existingUserIds = new Set(
      existingInvites?.map((inv) => inv.to_user_id) || []
    )

    const newInvites = usersToInvite
      .filter((profile) => !existingUserIds.has(profile.id))
      .map((profile) => ({
        lobby_id: lobbyId,
        from_user_id: user.id,
        to_user_id: profile.id,
        status: 'pending' as const,
      }))

    if (newInvites.length === 0) {
      return NextResponse.json({ 
        invited: 0,
        message: 'All eligible users already have pending invites' 
      })
    }

    // Insert invites
    const { error: inviteError } = await supabase
      .from('lobby_invites')
      .insert(newInvites)

    if (inviteError) {
      console.error('Error creating invites:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invites' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      invited: newInvites.length,
      message: `Sent ${newInvites.length} invite(s)` 
    })
  } catch (error) {
    console.error('Error in auto-invite API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


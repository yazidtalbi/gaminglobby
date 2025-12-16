import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify notifications are being created
 * This helps debug if the trigger is working
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if notifications table exists and has data
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'game_lobby_created')
      .order('created_at', { ascending: false })
      .limit(10)

    if (notifError) {
      return NextResponse.json({
        error: 'Error querying notifications',
        details: notifError.message,
        hint: 'Make sure the migration 019_add_game_lobby_notifications.sql has been run'
      }, { status: 500 })
    }

    // Check user preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('enable_lobby_notifications')
      .eq('id', user.id)
      .single()

    const { data: userGames } = await supabase
      .from('user_games')
      .select('game_id, game_name, enable_lobby_notifications')
      .eq('user_id', user.id)

    // Note: Can't directly check trigger via RPC without custom function
    // User should check in Supabase SQL editor

    return NextResponse.json({
      notifications: notifications || [],
      count: notifications?.length || 0,
      userPreferences: {
        global: profile?.enable_lobby_notifications ?? true,
        perGame: userGames?.map(ug => ({
          game_id: ug.game_id,
          game_name: ug.game_name,
          enabled: ug.enable_lobby_notifications ?? true
        })) || []
      },
      message: 'Check Supabase SQL editor to verify trigger exists. Run: SELECT * FROM pg_trigger WHERE tgname = \'on_lobby_created_notifications\';'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

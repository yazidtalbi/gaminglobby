import { NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createPublicSupabaseClient()
    
    // Get active lobbies count
    const { count: activeLobbiesCount } = await supabase
      .from('lobbies')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
    
    // Get active users (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const { count: activeUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', oneDayAgo.toISOString())
    
    // Get total users
    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get recent lobbies (last hour)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    const { data: recentLobbies } = await supabase
      .from('lobbies')
      .select('id, created_at')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get last lobby created
    const { data: lastLobby } = await supabase
      .from('lobbies')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return NextResponse.json({
      activeLobbies: activeLobbiesCount || 0,
      activeUsers: activeUsersCount || 0,
      totalUsers: totalUsersCount || 0,
      recentLobbiesCount: recentLobbies?.length || 0,
      lastLobbyCreated: lastLobby?.created_at || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching activity stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity stats' },
      { status: 500 }
    )
  }
}

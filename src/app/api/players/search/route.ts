import { NextRequest, NextResponse } from 'next/server'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = request.nextUrl.searchParams.get('query')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const supabase = createPublicSupabaseClient()

    // Search profiles by username or display_name (case-insensitive)
    // Using ilike for case-insensitive pattern matching with % wildcards
    const searchPattern = `%${query}%`
    
    // Query profiles matching username or display_name
    // Supabase PostgREST or syntax: column.operator.value,column.operator.value
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, plan_tier, plan_expires_at, last_active_at, is_private')
      .or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`)
      .eq('is_private', false) // Only show public profiles
      .order('last_active_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error searching players:', error)
      return NextResponse.json({ error: 'Failed to search players' }, { status: 500 })
    }

    return NextResponse.json({ results: data || [] })
  } catch (error) {
    console.error('Error in player search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

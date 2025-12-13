import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/premium'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || user.id
    const includePublic = searchParams.get('include_public') === 'true'

    let query = supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    // If viewing own collections or includePublic is true, show all
    // Otherwise only show public collections
    if (userId !== user.id && !includePublic) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    return NextResponse.json({ collections: data || [] })
  } catch (error) {
    console.error('Error in collections GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
        { error: 'Pro subscription required to create collections' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, is_public, is_pinned } = body

    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        title,
        description,
        is_public: is_public ?? false,
        is_pinned: is_pinned ?? false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
    }

    return NextResponse.json({ collection: data })
  } catch (error) {
    console.error('Error in collections POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


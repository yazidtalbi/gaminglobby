import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isPro } from '@/lib/premium'

// GET - Fetch feature suggestions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'upvotes'

    let query = supabase
      .from('feature_suggestions')
      .select(`
        *,
        user:profiles!feature_suggestions_user_id_fkey(username, avatar_url)
      `)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (sortBy === 'upvotes') {
      query = query.order('upvotes', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching suggestions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ suggestions: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/roadmap/suggestions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Create feature suggestion
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const { data: suggestion, error } = await supabase
      .from('feature_suggestions')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category: category || 'feature',
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating suggestion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ suggestion }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/roadmap/suggestions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update suggestion status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (pro or founder user)
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    const { data: suggestion, error } = await supabase
      .from('feature_suggestions')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating suggestion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ suggestion })
  } catch (error: any) {
    console.error('Error in PATCH /api/roadmap/suggestions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


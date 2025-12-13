import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isPro } from '@/lib/premium'

// GET - Fetch roadmap items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('roadmap_items')
      .select('*')
      .order('order_index', { ascending: true })
      .order('target_date', { ascending: true })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching roadmap items:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/roadmap:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Create roadmap item (admin only)
export async function POST(request: NextRequest) {
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
    const { title, description, status, priority, target_date, category, order_index } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: roadmapItem, error } = await supabase
      .from('roadmap_items')
      .insert({
        title,
        description,
        status: status || 'planned',
        priority: priority || 'medium',
        target_date,
        category: category || 'feature',
        created_by: user.id,
        order_index: order_index || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating roadmap item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: roadmapItem }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/roadmap:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update roadmap item (admin only)
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { data: roadmapItem, error } = await supabase
      .from('roadmap_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating roadmap item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: roadmapItem })
  } catch (error: any) {
    console.error('Error in PATCH /api/roadmap:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete roadmap item (admin only)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('roadmap_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting roadmap item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/roadmap:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


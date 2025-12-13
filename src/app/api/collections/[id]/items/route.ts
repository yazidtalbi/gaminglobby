import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/premium'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify collection ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check Pro requirement
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
        { error: 'Pro subscription required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { game_id, game_name, position } = body

    // Get max position if not provided
    let itemPosition = position
    if (itemPosition === undefined) {
      const { data: items } = await supabase
        .from('collection_items')
        .select('position')
        .eq('collection_id', params.id)
        .order('position', { ascending: false })
        .limit(1)
      
      itemPosition = items && items.length > 0 ? items[0].position + 1 : 0
    }

    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: params.id,
        game_id,
        game_name,
        position: itemPosition,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding item to collection:', error)
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error in collection items POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')

    if (!itemId) {
      return NextResponse.json({ error: 'item_id required' }, { status: 400 })
    }

    // Verify collection ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId)
      .eq('collection_id', params.id)

    if (error) {
      console.error('Error removing item from collection:', error)
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in collection items DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


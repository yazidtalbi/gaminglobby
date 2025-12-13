import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/premium'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', params.id)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Check if user can view this collection
    if (!collection.is_public && collection.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get collection items
    const { data: items, error: itemsError } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', params.id)
      .order('position', { ascending: true })

    if (itemsError) {
      console.error('Error fetching collection items:', itemsError)
    }

    return NextResponse.json({
      collection,
      items: items || [],
    })
  } catch (error) {
    console.error('Error in collection GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, is_public, is_pinned } = body

    // Check Pro requirement for pinning
    if (is_pinned === true) {
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
          { error: 'Pro subscription required to pin collections' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('collections')
      .update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(is_public !== undefined && { is_public }),
        ...(is_pinned !== undefined && { is_pinned }),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating collection:', error)
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
    }

    return NextResponse.json({ collection: data })
  } catch (error) {
    console.error('Error in collection PATCH:', error)
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

    // Verify ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting collection:', error)
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in collection DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


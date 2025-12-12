import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Toggle upvote
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { suggestion_id } = body

    if (!suggestion_id) {
      return NextResponse.json({ error: 'Suggestion ID is required' }, { status: 400 })
    }

    // Check if already upvoted
    const { data: existing } = await supabase
      .from('feature_suggestion_upvotes')
      .select('id')
      .eq('suggestion_id', suggestion_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Remove upvote
      const { error } = await supabase
        .from('feature_suggestion_upvotes')
        .delete()
        .eq('suggestion_id', suggestion_id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing upvote:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ upvoted: false })
    } else {
      // Add upvote
      const { error } = await supabase
        .from('feature_suggestion_upvotes')
        .insert({
          suggestion_id,
          user_id: user.id,
        })

      if (error) {
        console.error('Error adding upvote:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ upvoted: true })
    }
  } catch (error: any) {
    console.error('Error in POST /api/roadmap/suggestions/upvote:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


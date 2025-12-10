import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper function to get ISO week string (e.g., "2025-W10")
function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin check here
    // For now, allow any authenticated user (you should restrict this)

    const body = await request.json()
    const { voting_ends_at } = body

    if (!voting_ends_at) {
      return NextResponse.json({ error: 'Missing voting_ends_at' }, { status: 400 })
    }

    // Check if there's already an open round
    const { data: existingRound } = await supabase
      .from('weekly_rounds')
      .select('*')
      .eq('status', 'open')
      .single()

    if (existingRound) {
      return NextResponse.json(
        { error: 'There is already an open voting round' },
        { status: 400 }
      )
    }

    // Get current week key
    const weekKey = getISOWeekString(new Date())

    // Create new round
    const { data: round, error } = await supabase
      .from('weekly_rounds')
      .insert({
        week_key: weekKey,
        status: 'open',
        voting_ends_at,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating round:', error)
      return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
    }

    return NextResponse.json({ round })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Use service role key for admin access to auth.users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get user id from profiles by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 404 }
      )
    }

    // Get email from auth.users using admin client
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: authUser.user.email })
  } catch (error) {
    console.error('Error getting email by username:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

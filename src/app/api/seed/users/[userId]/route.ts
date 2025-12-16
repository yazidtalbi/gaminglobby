import { NextResponse } from 'next/server'

// Create Supabase client function to avoid module-level initialization issues
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication and founder status
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const serverSupabase = await createServerSupabaseClient()
    
    const { data: { user } } = await serverSupabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is founder
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan_tier !== 'founder') {
      return NextResponse.json(
        { error: 'Forbidden: Founder access required' },
        { status: 403 }
      )
    }

    const supabase = await getSupabaseClient()
    const userId = params.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify this is a seeded user (check email)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    
    if (!authUser?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of seeded users
    if (!authUser.user.email?.includes('@seed.example.com')) {
      return NextResponse.json(
        { error: 'Only seeded users can be deleted' },
        { status: 403 }
      )
    }

    // Delete the auth user (this will cascade delete the profile due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete user', details: deleteError.message },
        { status: 500 }
      )
    }

    // Also delete from storage (avatars/banners)
    try {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId)

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${userId}/${file.name}`)
        await supabase.storage
          .from('avatars')
          .remove(filePaths)
      }
    } catch (storageError) {
      // Log but don't fail if storage cleanup fails
      console.error('Error cleaning up storage:', storageError)
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      userId,
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

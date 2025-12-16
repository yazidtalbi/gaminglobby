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

export async function GET() {
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

    // Strategy: Get all profiles, then fetch auth users with pagination
    // Get all profiles first (no limit)
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      )
    }

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({
        users: [],
        count: 0,
      })
    }

    // Get ALL auth users - try pagination if supported, otherwise get all at once
    const authUsersMap = new Map<string, any>()
    
    // First attempt: get all users (Supabase might return all or paginated)
    let allAuthUsers: any[] = []
    let currentPage = 1
    const maxPages = 50 // Safety limit
    
    while (currentPage <= maxPages) {
      try {
        // Try with pagination parameters
        const { data: authUsersData, error: listError } = await supabase.auth.admin.listUsers({
          page: currentPage,
          perPage: 1000,
        })
        
        if (listError) {
          // If pagination fails, try without parameters (might return all)
          if (currentPage === 1) {
            const { data: allUsersData } = await supabase.auth.admin.listUsers()
            if (allUsersData?.users) {
              allAuthUsers.push(...allUsersData.users)
            }
          }
          break
        }
        
        if (!authUsersData?.users || authUsersData.users.length === 0) {
          break
        }
        
        allAuthUsers.push(...authUsersData.users)
        
        // If we got fewer than 1000, we've reached the end
        if (authUsersData.users.length < 1000) {
          break
        }
        
        currentPage++
      } catch (error) {
        console.error('Error fetching auth users page', currentPage, ':', error)
        break
      }
    }
    
    // Map all auth users
    allAuthUsers.forEach((user) => {
      authUsersMap.set(user.id, user)
    })
    
    // For any profiles without auth users in our map, try to fetch them individually
    // This handles cases where listUsers didn't return all users
    const profileIds = allProfiles.map((p) => p.id)
    const missingProfileIds = profileIds.filter((id) => !authUsersMap.has(id))
    
    // Fetch missing auth users in parallel batches
    if (missingProfileIds.length > 0 && missingProfileIds.length <= 200) {
      const batchSize = 20
      for (let i = 0; i < missingProfileIds.length; i += batchSize) {
        const batch = missingProfileIds.slice(i, i + batchSize)
        const fetchPromises = batch.map(async (userId) => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId)
            if (authUser?.user) {
              authUsersMap.set(userId, authUser.user)
            }
          } catch (error) {
            // Skip if not found
          }
        })
        await Promise.all(fetchPromises)
      }
    }

    // Now match profiles with auth users and filter for seeded users
    const usersWithEmails = allProfiles
      .map((profile) => {
        const authUser = authUsersMap.get(profile.id)
        if (!authUser) {
          // If auth user not found, try to fetch it one more time
          // This handles edge cases where the user exists but wasn't in listUsers
          return null // We'll handle this below
        }
        
        const email = authUser.email || 'N/A'
        
        // Only include seeded users
        if (!email.includes('@seed.example.com')) {
          return null
        }

        return {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          email,
          created_at: profile.created_at,
        }
      })
      .filter((u): u is NonNullable<typeof u> => u !== null)

    // For any profiles that didn't match, try fetching their auth users individually
    // This ensures we don't miss any seeded users
    const unmatchedProfiles = allProfiles.filter((p) => !authUsersMap.has(p.id))
    
    if (unmatchedProfiles.length > 0) {
      console.log(`Fetching ${unmatchedProfiles.length} unmatched profiles individually`)
      
      for (const profile of unmatchedProfiles) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
          if (authUser?.user) {
            const email = authUser.user.email || 'N/A'
            if (email.includes('@seed.example.com')) {
              usersWithEmails.push({
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                email,
                created_at: profile.created_at,
              })
            }
          }
        } catch (error) {
          // Skip if not found
          continue
        }
      }
    }

    // Sort by created_at descending (most recent first)
    usersWithEmails.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    console.log(`Returning ${usersWithEmails.length} seeded users`)

    return NextResponse.json({
      users: usersWithEmails,
      count: usersWithEmails.length,
    })
  } catch (error: any) {
    console.error('Error fetching seeded users:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

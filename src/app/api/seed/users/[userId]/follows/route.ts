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

export async function POST(
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

    // Verify this is a seeded user
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    
    if (!authUser?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow for seeded users
    if (!authUser.user.email?.includes('@seed.example.com')) {
      return NextResponse.json(
        { error: 'Only seeded users can have follows generated' },
        { status: 403 }
      )
    }

    // Get all other seeded users
    const { data: allSeededUsers } = await supabase.auth.admin.listUsers()
    const seededUserIds = (allSeededUsers?.users || [])
      .filter((u) => u.email?.includes('@seed.example.com') && u.id !== userId)
      .map((u) => u.id)

    if (seededUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No other seeded users found to create follows with' },
        { status: 400 }
      )
    }

    // Get existing follows for this user
    const { data: existingFollows } = await supabase
      .from('follows')
      .select('follower_id, following_id')
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`)

    const existingRelationships = new Set<string>()
    if (existingFollows) {
      existingFollows.forEach((follow) => {
        if (follow.follower_id === userId) {
          existingRelationships.add(`follows-${follow.following_id}`)
        }
        if (follow.following_id === userId) {
          existingRelationships.add(`followed-by-${follow.follower_id}`)
        }
      })
    }

    // Generate random follow relationships
    // Mix of: user following others, and others following user
    const numFollows = Math.min(
      Math.floor(Math.random() * 10) + 5, // 5-15 follows
      seededUserIds.length
    )

    const followsToCreate: Array<{ follower_id: string; following_id: string }> = []
    const shuffledUsers = [...seededUserIds].sort(() => Math.random() - 0.5)

    let created = 0
    for (const otherUserId of shuffledUsers) {
      if (created >= numFollows) break

      // Randomly decide: user follows other, or other follows user, or both
      const relationshipType = Math.random()

      // User follows other user (50% chance)
      if (relationshipType < 0.5) {
        const key = `follows-${otherUserId}`
        if (!existingRelationships.has(key)) {
          followsToCreate.push({
            follower_id: userId,
            following_id: otherUserId,
          })
          existingRelationships.add(key)
          created++
        }
      }
      // Other user follows this user (30% chance)
      else if (relationshipType < 0.8) {
        const key = `followed-by-${otherUserId}`
        if (!existingRelationships.has(key)) {
          followsToCreate.push({
            follower_id: otherUserId,
            following_id: userId,
          })
          existingRelationships.add(key)
          created++
        }
      }
      // Both follow each other (20% chance)
      else {
        const key1 = `follows-${otherUserId}`
        const key2 = `followed-by-${otherUserId}`
        if (!existingRelationships.has(key1) && !existingRelationships.has(key2)) {
          followsToCreate.push(
            {
              follower_id: userId,
              following_id: otherUserId,
            },
            {
              follower_id: otherUserId,
              following_id: userId,
            }
          )
          existingRelationships.add(key1)
          existingRelationships.add(key2)
          created += 2
        }
      }
    }

    if (followsToCreate.length === 0) {
      return NextResponse.json({
        message: 'No new follow relationships could be created (all relationships may already exist)',
        created: 0,
      })
    }

    // Insert follow relationships
    const { error: insertError } = await supabase
      .from('follows')
      .insert(followsToCreate)

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create follow relationships', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Follow relationships created successfully',
      created: followsToCreate.length,
      relationships: {
        following: followsToCreate.filter((f) => f.follower_id === userId).length,
        followers: followsToCreate.filter((f) => f.following_id === userId).length,
      },
    })
  } catch (error: any) {
    console.error('Error creating follow relationships:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

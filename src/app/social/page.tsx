'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ActivityFeedItem } from '@/components/ActivityFeedItem'
import { ActivityFeedFilters } from '@/components/ActivityFeedFilters'
import { FollowingsAvatars } from '@/components/FollowingsAvatars'
import { RecentPlayersSidebar } from '@/components/RecentPlayersSidebar'
import { Loader2 } from 'lucide-react'

interface Activity {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  activity_type: string
  activity_data: any
  created_at: string
  game_id?: number | string
  game_cover_url?: string | null
}

export default function SocialPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'followed' | string>('followed')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const hasFetchedRef = useRef(false)
  const isLoadingMoreRef = useRef(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const fetchActivities = async (reset = false) => {
    if (isLoadingMoreRef.current) return
    
    isLoadingMoreRef.current = true
    const currentOffset = reset ? 0 : offset

    try {
      // Always get followed user IDs (only show activities from followed users)
      let followedUserIds: string[] = []
      if (user) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        
        followedUserIds = follows?.map(f => f.following_id) || []
        
        if (followedUserIds.length === 0) {
          setActivities(reset ? [] : activities)
          setHasMore(false)
          isLoadingMoreRef.current = false
          return
        }
      } else {
        // If not logged in, show no activities
        setActivities(reset ? [] : activities)
        setHasMore(false)
        isLoadingMoreRef.current = false
        return
      }


      // Build activities from existing tables
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoISO = sevenDaysAgo.toISOString()

      const activitiesList: Activity[] = []

      // 1. Lobby creations
      // Show: If filter is "all" and game is in user's library, OR if filter is "followed" and user is followed
      if (!typeFilter || typeFilter === 'lobby_created') {
        let lobbyQuery = supabase
          .from('lobbies')
          .select(`
            id,
            host_id,
            game_id,
            game_name,
            created_at,
            host:profiles!lobbies_host_id_fkey(username, avatar_url)
          `)
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          lobbyQuery = lobbyQuery.in('host_id', followedUserIds)
        }

        const { data: lobbies } = await lobbyQuery

        lobbies?.forEach(lobby => {
          activitiesList.push({
            id: `lobby_${lobby.id}`,
            user_id: lobby.host_id,
            username: (lobby.host as any)?.username || 'Unknown',
            avatar_url: (lobby.host as any)?.avatar_url || null,
            activity_type: 'lobby_created',
            activity_data: {
              lobby_id: lobby.id,
              game_id: lobby.game_id,
              game_name: lobby.game_name,
            },
            created_at: lobby.created_at,
            game_id: lobby.game_id, // For fetching cover
          })
        })
      }

      // 2. Game additions
      if (!typeFilter || typeFilter === 'game_added') {
        let gameQuery = supabase
          .from('user_games')
          .select(`
            user_id,
            game_id,
            game_name,
            created_at,
            user:profiles!user_games_user_id_fkey(username, avatar_url)
          `)
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          gameQuery = gameQuery.in('user_id', followedUserIds)
        }

        const { data: userGames } = await gameQuery

        userGames?.forEach(ug => {
          activitiesList.push({
            id: `game_${ug.user_id}_${ug.game_id}_${ug.created_at}`,
            user_id: ug.user_id,
            username: (ug.user as any)?.username || 'Unknown',
            avatar_url: (ug.user as any)?.avatar_url || null,
            activity_type: 'game_added',
            activity_data: {
              game_id: ug.game_id,
              game_name: ug.game_name,
            },
            created_at: ug.created_at,
            game_id: ug.game_id, // For fetching cover
          })
        })
      }

      // 3. Event creations
      // Show: If filter is "all" and game is in user's library, OR if filter is "followed" and user is followed
      if (!typeFilter || typeFilter === 'event_created') {
        let eventQuery = supabase
          .from('events')
          .select(`
            id,
            created_by,
            title,
            game_id,
            game_name,
            created_at,
            creator:profiles!events_created_by_fkey(username, avatar_url)
          `)
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          eventQuery = eventQuery.in('created_by', followedUserIds)
        }

        const { data: events } = await eventQuery

        events?.forEach(event => {
          activitiesList.push({
            id: `event_${event.id}`,
            user_id: event.created_by,
            username: (event.creator as any)?.username || 'Unknown',
            avatar_url: (event.creator as any)?.avatar_url || null,
            activity_type: 'event_created',
            activity_data: {
              event_id: event.id,
              event_name: event.title,
              game_id: event.game_id,
              game_name: event.game_name,
            },
            created_at: event.created_at,
            game_id: event.game_id, // For fetching cover
          })
        })
      }

      // 4. Event participations
      if (!typeFilter || typeFilter === 'event_joined') {
        let participantQuery = supabase
          .from('event_participants')
          .select(`
            user_id,
            event_id,
            created_at,
            event:events!event_participants_event_id_fkey(id, title, game_id, game_name),
            user:profiles!event_participants_user_id_fkey(username, avatar_url)
          `)
          .eq('status', 'in')
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          participantQuery = participantQuery.in('user_id', followedUserIds)
        } else {
          // No followed users, skip this query
          participantQuery = participantQuery.eq('user_id', '') // This will return no results
        }

        const { data: participants } = await participantQuery

        participants?.forEach(participant => {
          const event = participant.event as any
          if (event) {
            activitiesList.push({
              id: `event_join_${participant.user_id}_${participant.event_id}_${participant.created_at}`,
              user_id: participant.user_id,
              username: (participant.user as any)?.username || 'Unknown',
              avatar_url: (participant.user as any)?.avatar_url || null,
              activity_type: 'event_joined',
              activity_data: {
                event_id: event.id,
                event_name: event.title,
                game_id: event.game_id,
                game_name: event.game_name,
              },
              created_at: participant.created_at,
              game_id: event.game_id, // For fetching cover
            })
          }
        })
      }

      // 5. Lobby joins
      if (!typeFilter || typeFilter === 'lobby_joined') {
        let memberQuery = supabase
          .from('lobby_members')
          .select(`
            user_id,
            lobby_id,
            created_at,
            lobby:lobbies!lobby_members_lobby_id_fkey(id, game_id, game_name, status),
            user:profiles!lobby_members_user_id_fkey(username, avatar_url)
          `)
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          memberQuery = memberQuery.in('user_id', followedUserIds)
        } else {
          // No followed users, skip this query
          memberQuery = memberQuery.eq('user_id', '') // This will return no results
        }

        const { data: members } = await memberQuery

        members?.forEach(member => {
          const lobby = member.lobby as any
          if (lobby && (lobby.status === 'open' || lobby.status === 'in_progress')) {
            activitiesList.push({
              id: `lobby_join_${member.user_id}_${member.lobby_id}_${member.created_at}`,
              user_id: member.user_id,
              username: (member.user as any)?.username || 'Unknown',
              avatar_url: (member.user as any)?.avatar_url || null,
              activity_type: 'lobby_joined',
              activity_data: {
                lobby_id: lobby.id,
                game_id: lobby.game_id,
                game_name: lobby.game_name,
              },
              created_at: member.created_at,
            })
          }
        })
      }

      // 6. Follows
      if (!typeFilter || typeFilter === 'user_followed') {
        let followQuery = supabase
          .from('follows')
          .select(`
            follower_id,
            following_id,
            created_at,
            follower:profiles!follows_follower_id_fkey(username, avatar_url),
            following:profiles!follows_following_id_fkey(username)
          `)
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          followQuery = followQuery.in('follower_id', followedUserIds)
        }

        const { data: follows } = await followQuery

        follows?.forEach(follow => {
          activitiesList.push({
            id: `follow_${follow.follower_id}_${follow.following_id}_${follow.created_at}`,
            user_id: follow.follower_id,
            username: (follow.follower as any)?.username || 'Unknown',
            avatar_url: (follow.follower as any)?.avatar_url || null,
            activity_type: 'user_followed',
            activity_data: {
              followed_user_id: follow.following_id,
              followed_username: (follow.following as any)?.username || 'Unknown',
            },
            created_at: follow.created_at,
          })
        })
      }

      // 7. Recent encounters (if user is logged in)
      if (user && (!typeFilter || typeFilter === 'recent_encounter')) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        let encounterQuery = supabase
          .from('recent_players')
          .select(`
            user_id,
            encountered_player_id,
            lobby_id,
            last_encountered_at,
            user:profiles!recent_players_user_id_fkey(username, avatar_url),
            encountered:profiles!recent_players_encountered_player_id_fkey(username)
          `)
          .gte('last_encountered_at', thirtyDaysAgo.toISOString())
          .order('last_encountered_at', { ascending: false })
          .limit(50)

        if (followedUserIds.length > 0) {
          encounterQuery = encounterQuery.in('user_id', followedUserIds)
        }

        const { data: encounters } = await encounterQuery

        encounters?.forEach(encounter => {
          activitiesList.push({
            id: `encounter_${encounter.user_id}_${encounter.encountered_player_id}_${encounter.last_encountered_at}`,
            user_id: encounter.user_id,
            username: (encounter.user as any)?.username || 'Unknown',
            avatar_url: (encounter.user as any)?.avatar_url || null,
            activity_type: 'recent_encounter',
            activity_data: {
              encountered_user_id: encounter.encountered_player_id,
              encountered_username: (encounter.encountered as any)?.username || 'Unknown',
              lobby_id: encounter.lobby_id,
            },
            created_at: encounter.last_encountered_at,
          })
        })
      }

      // Sort all activities by created_at
      activitiesList.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Fetch square game covers for activities with games (like sidebar)
      const activitiesWithGames = activitiesList.filter(a => a.game_id)
      const gameCoverPromises = activitiesWithGames.map(async (activity) => {
        try {
          const response = await fetch(`/api/steamgriddb/game?id=${activity.game_id}`)
          const data = await response.json()
          return {
            activityId: activity.id,
            coverUrl: data.game?.squareCoverThumb || data.game?.squareCoverUrl || null,
          }
        } catch (error) {
          console.error('Error fetching game cover:', error)
          return { activityId: activity.id, coverUrl: null }
        }
      })

      const coverResults = await Promise.all(gameCoverPromises)
      const coverMap = new Map(coverResults.map(r => [r.activityId, r.coverUrl]))

      // Add cover URLs to activities
      activitiesList.forEach(activity => {
        if (activity.game_id) {
          activity.game_cover_url = coverMap.get(activity.id) || null
        }
      })

      // Apply pagination
      const limit = 20
      const paginatedActivities = activitiesList.slice(currentOffset, currentOffset + limit)

      if (reset) {
        setActivities(paginatedActivities)
      } else {
        setActivities(prev => [...prev, ...paginatedActivities])
      }

      setHasMore(paginatedActivities.length === limit && activitiesList.length > currentOffset + limit)
      setOffset(currentOffset + paginatedActivities.length)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoading(false)
      isLoadingMoreRef.current = false
    }
  }

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchActivities(true)
      hasFetchedRef.current = true
    }
  }, [])

  useEffect(() => {
    // Refetch when filters change
    hasFetchedRef.current = false
    setOffset(0)
    setActivities([])
    fetchActivities(true)
  }, [filter, typeFilter])

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Always get followed user IDs (only show activities from followed users)
    let followedUserIdsPromise: Promise<string[]> = Promise.resolve([])
    if (user) {
      followedUserIdsPromise = supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .then(({ data }) => data?.map(f => f.following_id) || [])
    }

    const channels = [
      // Lobby creations
      supabase
        .channel('social_lobbies')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lobbies',
          },
          async (payload) => {
            // Fetch the lobby with user info
            const { data: lobby } = await supabase
              .from('lobbies')
              .select(`
                id,
                host_id,
                game_id,
                game_name,
                created_at,
                host:profiles!lobbies_host_id_fkey(username, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()

            if (lobby && (!typeFilter || typeFilter === 'lobby_created')) {
              // Check if we should include this activity (only from followed users)
              followedUserIdsPromise.then(async (followedIds) => {
                if (!followedIds.includes(lobby.host_id)) {
                  return
                }
                
                // Fetch square game cover (like sidebar)
                let gameCoverUrl = null
                if (lobby.game_id) {
                  try {
                    const response = await fetch(`/api/steamgriddb/game?id=${lobby.game_id}`)
                    const data = await response.json()
                    gameCoverUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
                  } catch (error) {
                    console.error('Error fetching game cover:', error)
                  }
                }
                
                const newActivity: Activity = {
                  id: `lobby_${lobby.id}`,
                  user_id: lobby.host_id,
                  username: (lobby.host as any)?.username || 'Unknown',
                  avatar_url: (lobby.host as any)?.avatar_url || null,
                  activity_type: 'lobby_created',
                  activity_data: {
                    lobby_id: lobby.id,
                    game_id: lobby.game_id,
                    game_name: lobby.game_name,
                  },
                  created_at: lobby.created_at,
                  game_id: lobby.game_id,
                  game_cover_url: gameCoverUrl,
                }
                setActivities(prev => [newActivity, ...prev])
              })
            }
          }
        )
        .subscribe(),

      // Game additions
      supabase
        .channel('social_games')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_games',
          },
          async (payload) => {
            const { data: userGame } = await supabase
              .from('user_games')
              .select(`
                user_id,
                game_id,
                game_name,
                created_at,
                user:profiles!user_games_user_id_fkey(username, avatar_url)
              `)
              .eq('user_id', payload.new.user_id)
              .eq('game_id', payload.new.game_id)
              .single()

            if (userGame && (!typeFilter || typeFilter === 'game_added')) {
              followedUserIdsPromise.then(async (followedIds) => {
                if (followedIds.length === 0 || !followedIds.includes(userGame.user_id)) {
                  return
                }
                
                // Fetch square game cover (like sidebar)
                let gameCoverUrl = null
                if (userGame.game_id) {
                  try {
                    const response = await fetch(`/api/steamgriddb/game?id=${userGame.game_id}`)
                    const data = await response.json()
                    gameCoverUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
                  } catch (error) {
                    console.error('Error fetching game cover:', error)
                  }
                }
                
                const newActivity: Activity = {
                  id: `game_${userGame.user_id}_${userGame.game_id}_${userGame.created_at}`,
                  user_id: userGame.user_id,
                  username: (userGame.user as any)?.username || 'Unknown',
                  avatar_url: (userGame.user as any)?.avatar_url || null,
                  activity_type: 'game_added',
                  activity_data: {
                    game_id: userGame.game_id,
                    game_name: userGame.game_name,
                  },
                  created_at: userGame.created_at,
                  game_id: userGame.game_id,
                  game_cover_url: gameCoverUrl,
                }
                setActivities(prev => [newActivity, ...prev])
              })
            }
          }
        )
        .subscribe(),

      // Event creations
      supabase
        .channel('social_events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
          },
          async (payload) => {
            const { data: event } = await supabase
              .from('events')
              .select(`
                id,
                created_by,
                title,
                game_id,
                game_name,
                created_at,
                creator:profiles!events_created_by_fkey(username, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()

            if (event && (!typeFilter || typeFilter === 'event_created')) {
              followedUserIdsPromise.then(async (followedIds) => {
                if (followedIds.length === 0 || !followedIds.includes(event.created_by)) {
                  return
                }
                
                // Fetch square game cover (like sidebar)
                let gameCoverUrl = null
                if (event.game_id) {
                  try {
                    const response = await fetch(`/api/steamgriddb/game?id=${event.game_id}`)
                    const data = await response.json()
                    gameCoverUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
                  } catch (error) {
                    console.error('Error fetching game cover:', error)
                  }
                }
                
                const newActivity: Activity = {
                  id: `event_${event.id}`,
                  user_id: event.created_by,
                  username: (event.creator as any)?.username || 'Unknown',
                  avatar_url: (event.creator as any)?.avatar_url || null,
                  activity_type: 'event_created',
                  activity_data: {
                    event_id: event.id,
                    event_name: event.title,
                    game_id: event.game_id,
                    game_name: event.game_name,
                  },
                  created_at: event.created_at,
                  game_id: event.game_id,
                  game_cover_url: gameCoverUrl,
                }
                setActivities(prev => [newActivity, ...prev])
              })
            }
          }
        )
        .subscribe(),

      // Event participations
      supabase
        .channel('social_event_participants')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'event_participants',
            filter: 'status=eq.in',
          },
          async (payload) => {
            const { data: participant } = await supabase
              .from('event_participants')
              .select(`
                user_id,
                event_id,
                created_at,
                event:events!event_participants_event_id_fkey(id, title, game_id, game_name),
                user:profiles!event_participants_user_id_fkey(username, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()

            if (participant && (!typeFilter || typeFilter === 'event_joined')) {
              const event = participant.event as any
              if (event) {
                followedUserIdsPromise.then(async (followedIds) => {
                  if (followedIds.length === 0 || !followedIds.includes(participant.user_id)) {
                    return
                  }
                  
                  // Fetch square game cover (like sidebar)
                  let gameCoverUrl = null
                  if (event.game_id) {
                    try {
                      const response = await fetch(`/api/steamgriddb/game?id=${event.game_id}`)
                      const data = await response.json()
                      gameCoverUrl = data.game?.squareCoverThumb || data.game?.squareCoverUrl || null
                    } catch (error) {
                      console.error('Error fetching game cover:', error)
                    }
                  }
                  
                  const newActivity: Activity = {
                    id: `event_join_${participant.user_id}_${participant.event_id}_${participant.created_at}`,
                    user_id: participant.user_id,
                    username: (participant.user as any)?.username || 'Unknown',
                    avatar_url: (participant.user as any)?.avatar_url || null,
                    activity_type: 'event_joined',
                    activity_data: {
                      event_id: event.id,
                      event_name: event.title,
                      game_id: event.game_id,
                      game_name: event.game_name,
                    },
                    created_at: participant.created_at,
                    game_id: event.game_id,
                    game_cover_url: gameCoverUrl,
                  }
                  setActivities(prev => [newActivity, ...prev])
                })
              }
            }
          }
        )
        .subscribe(),

      // Follows
      supabase
        .channel('social_follows')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'follows',
          },
          async (payload) => {
            const { data: follow } = await supabase
              .from('follows')
              .select(`
                follower_id,
                following_id,
                created_at,
                follower:profiles!follows_follower_id_fkey(username, avatar_url),
                following:profiles!follows_following_id_fkey(username)
              `)
              .eq('follower_id', payload.new.follower_id)
              .eq('following_id', payload.new.following_id)
              .single()

            if (follow && (!typeFilter || typeFilter === 'user_followed')) {
              followedUserIdsPromise.then(followedIds => {
                if (followedIds.length === 0 || !followedIds.includes(follow.follower_id)) {
                  return
                }
                
                const newActivity: Activity = {
                  id: `follow_${follow.follower_id}_${follow.following_id}_${follow.created_at}`,
                  user_id: follow.follower_id,
                  username: (follow.follower as any)?.username || 'Unknown',
                  avatar_url: (follow.follower as any)?.avatar_url || null,
                  activity_type: 'user_followed',
                  activity_data: {
                    followed_user_id: follow.following_id,
                    followed_username: (follow.following as any)?.username || 'Unknown',
                  },
                  created_at: follow.created_at,
                }
                setActivities(prev => [newActivity, ...prev])
              })
            }
          }
        )
        .subscribe(),
    ]

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [user, supabase, typeFilter, filter])

  const handleLoadMore = () => {
    if (!isLoadingMoreRef.current && hasMore) {
      fetchActivities(false)
    }
  }

  // Don't render content if not authenticated (will redirect)
  // This check must be after ALL hooks are declared
  if (!loading && !user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-title text-white">Social</h1>
        </div>

        {/* Followings Avatars */}
        <FollowingsAvatars userId={user?.id || null} />

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - Activity Feed */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <ActivityFeedFilters
              filter={filter}
              typeFilter={typeFilter}
              onFilterChange={setFilter}
              onTypeFilterChange={setTypeFilter}
            />

            {/* Activity Feed */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center rounded-lg">
            <p className="text-slate-400">
              No activities from users you follow yet.
            </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityFeedItem key={activity.id} activity={activity} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMoreRef.current}
                      className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 text-white font-title transition-colors disabled:opacity-50"
                    >
                      {isLoadingMoreRef.current ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Load More'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar - Recent Players */}
          <RecentPlayersSidebar />
        </div>
      </div>
    </div>
  )
}


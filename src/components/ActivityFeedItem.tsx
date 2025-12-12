'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateSlug } from '@/lib/slug'
import { 
  Users, 
  Gamepad2, 
  Calendar, 
  UserPlus, 
  Clock,
  ArrowRight,
  MessageCircle,
  Send
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { ActivityComments } from './ActivityComments'

interface ActivityFeedItemProps {
  activity: {
    id: string
    user_id: string
    username: string
    avatar_url: string | null
    activity_type: string
    activity_data: any
    created_at: string
    game_cover_url?: string | null
    plan_tier?: string | null
    plan_expires_at?: string | null
  }
}

export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [timeAgo, setTimeAgo] = useState<string>('')
  const supabase = createClient()

  // Get game ID for fetching cover
  const gameId = activity.activity_data?.game_id

  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      const { count } = await supabase
        .from('activity_comments')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activity.id)
      
      setCommentCount(count || 0)
    }

    fetchCommentCount()

    // Subscribe to new comments
    const channel = supabase
      .channel(`activity_comments_${activity.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_comments',
          filter: `activity_id=eq.${activity.id}`,
        },
        () => {
          fetchCommentCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activity.id, supabase])

  // Check if activity has a game
  const hasGame = gameId && (
    activity.activity_type === 'lobby_created' ||
    activity.activity_type === 'game_added' ||
    activity.activity_type === 'event_created' ||
    activity.activity_type === 'event_joined'
  )
  const getActivityContent = () => {
    switch (activity.activity_type) {
      case 'lobby_created':
        return {
          icon: <Users className="w-4 h-4 text-cyan-400" />,
          text: (
            <>
              created a lobby
            </>
          ),
          actions: activity.activity_data.lobby_id ? (
            <Link
              href={`/lobbies/${activity.activity_data.lobby_id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View Lobby <ArrowRight className="w-3 h-3" />
            </Link>
          ) : null
        }
      
      case 'game_added':
        return {
          icon: <Gamepad2 className="w-4 h-4 text-green-400" />,
          text: (
            <>
              added a game to their library
            </>
          ),
          actions: (
            <Link
              href={`/games/${activity.activity_data.game_id ? generateSlug(activity.activity_data.game_name || '') : activity.activity_data.game_id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View Game <ArrowRight className="w-3 h-3" />
            </Link>
          )
        }
      
      case 'event_created':
        return {
          icon: <Calendar className="w-4 h-4 text-amber-400" />,
          text: (
            <>
              created event{' '}
              <Link 
                href={`/events/${activity.activity_data.event_id}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {activity.activity_data.event_name || 'an event'}
              </Link>
            </>
          ),
          actions: activity.activity_data.event_id ? (
            <Link
              href={`/events/${activity.activity_data.event_id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View Event <ArrowRight className="w-3 h-3" />
            </Link>
          ) : null
        }
      
      case 'event_joined':
        return {
          icon: <Calendar className="w-4 h-4 text-lime-400" />,
          text: (
            <>
              joined event{' '}
              <Link 
                href={`/events/${activity.activity_data.event_id}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {activity.activity_data.event_name || 'an event'}
              </Link>
            </>
          ),
          actions: activity.activity_data.event_id ? (
            <Link
              href={`/events/${activity.activity_data.event_id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View Event <ArrowRight className="w-3 h-3" />
            </Link>
          ) : null
        }
      
      case 'user_followed':
        return {
          icon: <UserPlus className="w-4 h-4 text-purple-400" />,
          text: (
            <>
              started following{' '}
              <Link 
                href={`/u/${activity.activity_data.followed_username || activity.activity_data.followed_user_id}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                @{activity.activity_data.followed_username || 'user'}
              </Link>
            </>
          ),
          actions: (
            <Link
              href={`/u/${activity.activity_data.followed_username || activity.activity_data.followed_user_id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View Profile <ArrowRight className="w-3 h-3" />
            </Link>
          )
        }
      
      case 'recent_encounter':
        return {
          icon: <Users className="w-4 h-4 text-blue-400" />,
          text: (
            <>
              recently played with{' '}
              <Link 
                href={`/u/${activity.activity_data.encountered_username || activity.activity_data.encountered_user_id}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                @{activity.activity_data.encountered_username || 'user'}
              </Link>
            </>
          ),
          actions: (
            <div className="flex items-center gap-3">
              <Link
                href={`/u/${activity.activity_data.encountered_username || activity.activity_data.encountered_user_id}`}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View Profile <ArrowRight className="w-3 h-3" />
              </Link>
              {activity.activity_data.lobby_id && (
                <Link
                  href={`/lobbies/${activity.activity_data.lobby_id}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  View Lobby <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )
        }
      
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          text: <span>performed an action</span>,
          actions: null
        }
    }
  }

  // Calculate time ago on client only to avoid hydration errors
  useEffect(() => {
    const calculateTimeAgo = () => {
      const date = new Date(activity.created_at)
      const now = new Date()
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (seconds < 60) return 'Just now'
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    setTimeAgo(calculateTimeAgo())

    // Update every minute
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo())
    }, 60000)

    return () => clearInterval(interval)
  }, [activity.created_at])

  const content = getActivityContent()

  // Get game name for display
  const gameName = activity.activity_data?.game_name || ''

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-colors p-4 rounded-lg">
      <div className="flex items-start gap-4">
        {/* User Avatar (Left) */}
        <Link href={`/u/${activity.username || activity.user_id}`} className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-colors ${
            activity.plan_tier === 'founder'
              ? 'border-purple-400 hover:border-purple-300'
              : activity.plan_tier === 'pro' && 
                (!activity.plan_expires_at || new Date(activity.plan_expires_at) > new Date())
                ? 'border-yellow-400 hover:border-yellow-300' 
                : 'border-slate-600 hover:border-cyan-400'
          }`}>
            {activity.avatar_url ? (
              <img
                src={activity.avatar_url}
                alt={activity.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                <span className="text-sm text-slate-400 font-title">
                  {activity.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Content (Right) */}
        <div className="flex-1 min-w-0">
          {/* Activity Text */}
          <div className="flex items-start gap-2 mb-3">
            {content.icon}
            <div className="flex-1">
              <Link 
                href={`/u/${activity.username || activity.user_id}`}
                className="font-title text-white hover:text-cyan-400 transition-colors inline-block mr-1"
              >
                @{activity.username || 'user'}
              </Link>
              <span className="text-slate-300"> {content.text}</span>
            </div>
          </div>

          {/* Game Title and Square Cover - Horizontally placed */}
          {hasGame && (
            <Link
              href={`/games/${gameId ? generateSlug(gameName) : gameId}`}
              className="flex items-center gap-3 mb-3 p-2 bg-slate-900/50 rounded border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
            >
              {/* Square Game Cover */}
              {activity.game_cover_url ? (
                <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-slate-700/50">
                  <img
                    src={activity.game_cover_url}
                    alt={gameName || 'Game cover'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 rounded bg-slate-700/50 border border-slate-700/50 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-slate-500" />
                </div>
              )}
              
              {/* Game Title - Cyan text */}
              {gameName && (
                <h3 className="text-cyan-400 font-title text-base leading-tight hover:text-cyan-300 transition-colors flex-1">
                  {gameName.length > 50 ? `${gameName.substring(0, 50)}...` : gameName}
                </h3>
              )}
            </Link>
          )}
          
          {content.actions && (
            <div className="mt-2">
              {content.actions}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span suppressHydrationWarning>{timeAgo || 'Loading...'}</span>
            </div>
            
            {user && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
              </button>
            )}
          </div>

          {/* Comments Section */}
          {showComments && user && (
            <div className="mt-3">
              <ActivityComments activityId={activity.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


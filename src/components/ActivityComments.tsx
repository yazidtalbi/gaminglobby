'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Send, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  content: string
  created_at: string
  plan_tier?: string | null
  plan_expires_at?: string | null
}

interface ActivityCommentsProps {
  activityId: string
}

export function ActivityComments({ activityId }: ActivityCommentsProps) {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('activity_comments')
      .select(`
        id,
        user_id,
        content,
        created_at,
        user:profiles!activity_comments_user_id_fkey(username, avatar_url, plan_tier, plan_expires_at)
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return
    }

    const formattedComments: Comment[] = (data || []).map((comment: any) => ({
      id: comment.id,
      user_id: comment.user_id,
      username: (comment.user as any)?.username || 'Unknown',
      avatar_url: (comment.user as any)?.avatar_url || null,
      content: comment.content,
      created_at: comment.created_at,
    }))

    setComments(formattedComments)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchComments()

    // Subscribe to new comments
    const channel = supabase
      .channel(`activity_comments_${activityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_comments',
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activityId, supabase])

  useEffect(() => {
    // Scroll to bottom when new comments are added
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    const { error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        content: newComment.trim(),
      })

    if (error) {
      console.error('Error posting comment:', error)
    } else {
      setNewComment('')
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-sm text-slate-500 text-center py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-4">No comments yet</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <Link href={`/u/${comment.username || comment.user_id}`} className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full overflow-hidden border ${
                  comment.plan_tier === 'pro' && 
                  (!comment.plan_expires_at || new Date(comment.plan_expires_at) > new Date())
                    ? 'border-yellow-400' 
                    : 'border-slate-600'
                }`}>
                  {comment.avatar_url ? (
                    <img
                      src={comment.avatar_url}
                      alt={comment.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-title">
                        {comment.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="flex-1 min-w-0">
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/u/${comment.username || comment.user_id}`}
                      className="text-xs font-title text-cyan-400 hover:text-cyan-300"
                    >
                      @{comment.username}
                    </Link>
                    <span className="text-xs text-slate-500">{getTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-300">{comment.content}</p>
                </div>
                
                {user && user.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="mt-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}


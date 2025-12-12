'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Lightbulb, 
  Plus, 
  TrendingUp,
  X,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface RoadmapItem {
  id: string
  title: string
  description: string | null
  status: 'planned' | 'in_progress' | 'implemented' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  target_date: string | null
  category: 'feature' | 'improvement' | 'bug_fix' | 'other'
  created_at: string
}

interface FeatureSuggestion {
  id: string
  title: string
  description: string
  category: 'feature' | 'improvement' | 'bug_fix' | 'other'
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'implemented'
  user_id: string
  upvotes: number
  created_at: string
  user?: {
    username: string
    avatar_url: string | null
  }
  has_upvoted?: boolean
}

export default function RoadmapPage() {
  const { user } = useAuth()
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'implemented'>('all')
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'implemented'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'upvotes'>('upvotes')

  // Form state
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [suggestionDescription, setSuggestionDescription] = useState('')
  const [suggestionCategory, setSuggestionCategory] = useState<'feature' | 'improvement' | 'bug_fix' | 'other'>('feature')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRoadmapItems()
    fetchSuggestions()
  }, [filter, suggestionFilter, sortBy])

  async function fetchRoadmapItems() {
    try {
      const supabase = createClient()
      let query = supabase
        .from('roadmap_items')
        .select('*')
        .order('order_index', { ascending: true })
        .order('target_date', { ascending: true, nullsLast: true })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setRoadmapItems(data || [])
    } catch (error) {
      console.error('Error fetching roadmap items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSuggestions() {
    try {
      const supabase = createClient()
      let query = supabase
        .from('feature_suggestions')
        .select(`
          *,
          user:profiles!feature_suggestions_user_id_fkey(username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (suggestionFilter !== 'all') {
        query = query.eq('status', suggestionFilter)
      }

      if (sortBy === 'upvotes') {
        query = query.order('upvotes', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      // Check if user has upvoted each suggestion
      if (user && data) {
        const suggestionIds = data.map((s: FeatureSuggestion) => s.id)
        const { data: upvotes } = await supabase
          .from('feature_suggestion_upvotes')
          .select('suggestion_id')
          .eq('user_id', user.id)
          .in('suggestion_id', suggestionIds)

        const upvotedIds = new Set(upvotes?.map(u => u.suggestion_id) || [])
        data.forEach((suggestion: FeatureSuggestion) => {
          suggestion.has_upvoted = upvotedIds.has(suggestion.id)
        })
      }

      setSuggestions(data || [])
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  async function handleSubmitSuggestion(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      alert('Please log in to submit a suggestion')
      return
    }

    if (!suggestionTitle.trim() || !suggestionDescription.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('feature_suggestions')
        .insert({
          title: suggestionTitle.trim(),
          description: suggestionDescription.trim(),
          category: suggestionCategory,
          user_id: user.id,
        })

      if (error) throw error

      setSuggestionTitle('')
      setSuggestionDescription('')
      setSuggestionCategory('feature')
      setShowSuggestionModal(false)
      fetchSuggestions()
    } catch (error: any) {
      console.error('Error submitting suggestion:', error)
      alert('Failed to submit suggestion: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpvote(suggestionId: string, hasUpvoted: boolean) {
    if (!user) {
      alert('Please log in to upvote')
      return
    }

    try {
      const supabase = createClient()
      if (hasUpvoted) {
        const { error } = await supabase
          .from('feature_suggestion_upvotes')
          .delete()
          .eq('suggestion_id', suggestionId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('feature_suggestion_upvotes')
          .insert({
            suggestion_id: suggestionId,
            user_id: user.id,
          })

        if (error) throw error
      }

      fetchSuggestions()
    } catch (error: any) {
      console.error('Error toggling upvote:', error)
      alert('Failed to upvote: ' + (error.message || 'Unknown error'))
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'implemented':
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress':
      case 'under_review':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'planned':
      case 'pending':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'implemented':
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />
      case 'in_progress':
      case 'under_review':
        return <Clock className="w-4 h-4" />
      case 'cancelled':
      case 'rejected':
        return <X className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredRoadmap = roadmapItems.filter(item => {
    if (filter === 'all') return true
    return item.status === filter
  })

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (suggestionFilter === 'all') return true
    return suggestion.status === suggestionFilter
  })

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-title text-white mb-4">Roadmap</h1>
          <p className="text-lg text-slate-300 max-w-xl">
            See what we're building and share your ideas for the future of Apoxer.
          </p>
        </div>

        {/* Submit Suggestion Button */}
        {user && (
          <div className="mb-8">
            <button
              onClick={() => setShowSuggestionModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Suggest a Feature
            </button>
          </div>
        )}

        {/* Roadmap Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-title text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              Upcoming Features
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="implemented">Implemented</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading roadmap...</p>
            </div>
          ) : filteredRoadmap.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center">
              <p className="text-slate-400">No roadmap items found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoadmap.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-slate-300 text-sm mb-4 line-clamp-3">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    {item.target_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.target_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    <span className="capitalize">{item.category.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Feature Suggestions Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-title text-white flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-cyan-400" />
              Community Suggestions
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={suggestionFilter}
                onChange={(e) => setSuggestionFilter(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="upvotes">Most Upvoted</option>
                <option value="date">Newest</option>
              </select>
            </div>
          </div>

          {filteredSuggestions.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center">
              <p className="text-slate-400">No suggestions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h3>
                      <p className="text-slate-300 text-sm mb-3">{suggestion.description}</p>
                    </div>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ml-4 ${getStatusColor(suggestion.status)}`}
                    >
                      {getStatusIcon(suggestion.status)}
                      {suggestion.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {suggestion.user && (
                        <Link
                          href={`/u/${suggestion.user.username}`}
                          className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                        >
                          {suggestion.user.avatar_url ? (
                            <img
                              src={suggestion.user.avatar_url}
                              alt={suggestion.user.username}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-700" />
                          )}
                          <span>{suggestion.user.username}</span>
                        </Link>
                      )}
                      <span className="capitalize">{suggestion.category.replace('_', ' ')}</span>
                      <span>{format(new Date(suggestion.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <button
                      onClick={() => handleUpvote(suggestion.id, suggestion.has_upvoted || false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        suggestion.has_upvoted
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{suggestion.upvotes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-title text-white">Suggest a Feature</h2>
                <button
                  onClick={() => setShowSuggestionModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={suggestionTitle}
                    onChange={(e) => setSuggestionTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Brief description of your suggestion"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={suggestionDescription}
                    onChange={(e) => setSuggestionDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    placeholder="Describe your feature suggestion in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={suggestionCategory}
                    onChange={(e) => setSuggestionCategory(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="bug_fix">Bug Fix</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Suggestion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuggestionModal(false)}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


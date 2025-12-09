'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'

interface AddGuideModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  gameName: string
  userId: string
  onGuideAdded?: () => void
}

export function AddGuideModal({
  isOpen,
  onClose,
  gameId,
  gameName,
  userId,
  onGuideAdded,
}: AddGuideModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate URL
      try {
        new URL(url)
      } catch {
        setError('Please enter a valid URL')
        setIsSubmitting(false)
        return
      }

      // Fetch OG metadata from our API
      let ogData = { ogTitle: null, ogDescription: null, ogImageUrl: null }
      try {
        const ogResponse = await fetch('/api/guides/og', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        ogData = await ogResponse.json()
      } catch (ogError) {
        console.error('Failed to fetch OG data:', ogError)
        // Continue without OG data
      }

      // Insert guide
      const { error: insertError } = await supabase
        .from('game_guides')
        .insert({
          game_id: gameId,
          game_name: gameName,
          title,
          url,
          og_title: ogData.ogTitle,
          og_description: ogData.ogDescription,
          og_image_url: ogData.ogImageUrl,
          submitted_by: userId,
        })

      if (insertError) throw insertError

      onGuideAdded?.()
      onClose()
      
      // Reset form
      setTitle('')
      setUrl('')
    } catch (err) {
      console.error('Failed to add guide:', err)
      setError('Failed to add guide. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add Guide</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beginner's Guide to..."
              required
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-2">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
            <p className="text-xs text-slate-500 mt-1">
              We&apos;ll automatically fetch the preview image and description
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !title || !url}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Guide...
              </>
            ) : (
              'Add Guide'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}


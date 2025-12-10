'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, MessageSquare, Radio, Globe, HelpCircle } from 'lucide-react'

interface AddCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  gameName: string
  userId: string
  onCommunityAdded?: () => void
}

const communityTypes = [
  { value: 'discord', label: 'Discord', icon: MessageSquare },
  { value: 'mumble', label: 'Mumble', icon: Radio },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'other', label: 'Other', icon: HelpCircle },
] as const

export function AddCommunityModal({
  isOpen,
  onClose,
  gameId,
  gameName,
  userId,
  onCommunityAdded,
}: AddCommunityModalProps) {
  const [type, setType] = useState<'discord' | 'mumble' | 'website' | 'other'>('discord')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('game_communities')
        .insert({
          game_id: gameId,
          game_name: gameName,
          type,
          name,
          link,
          description: description || null,
          submitted_by: userId,
        })

      if (insertError) throw insertError

      onCommunityAdded?.()
      onClose()
      
      // Reset form
      setName('')
      setLink('')
      setDescription('')
      setType('discord')
    } catch (err) {
      console.error('Failed to add community:', err)
      setError('Failed to add community. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add Community</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {communityTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors
                    ${type === value
                      ? 'bg-app-green-600/20 border-app-green-500/50 text-app-green-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Official Discord"
              required
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
            />
          </div>

          {/* Link */}
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-slate-300 mb-2">
              Link / Connection Info
            </label>
            <input
              id="link"
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://discord.gg/..."
              required
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !name || !link}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Community'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}


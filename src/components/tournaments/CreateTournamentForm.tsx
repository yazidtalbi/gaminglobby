'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameSearch } from '@/components/GameSearch'
import { Loader2 } from 'lucide-react'
import { CreateTournamentInput } from '@/types/tournaments'

export function CreateTournamentForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null)

  const [formData, setFormData] = useState<Partial<CreateTournamentInput>>({
    title: '',
    description: '',
    max_participants: 8,
    platform: 'pc',
    check_in_required: true,
    rules: '',
    discord_link: '',
  })

  const [dates, setDates] = useState({
    start_at: '',
    registration_deadline: '',
    check_in_deadline: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedGame) {
      setError('Please select a game')
      return
    }

    if (!dates.start_at || !dates.registration_deadline) {
      setError('Please set start date and registration deadline')
      return
    }

    if (formData.check_in_required && !dates.check_in_deadline) {
      setError('Please set check-in deadline')
      return
    }

    // Validate dates
    const startAt = new Date(dates.start_at)
    const regDeadline = new Date(dates.registration_deadline)
    const checkInDeadline = formData.check_in_required ? new Date(dates.check_in_deadline) : null

    if (regDeadline >= startAt) {
      setError('Registration deadline must be before start time')
      return
    }

    if (formData.check_in_required && checkInDeadline) {
      if (checkInDeadline >= startAt || checkInDeadline <= regDeadline) {
        setError('Check-in deadline must be between registration deadline and start time')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payload: CreateTournamentInput = {
        game_id: selectedGame.id,
        game_name: selectedGame.name,
        title: formData.title!,
        description: formData.description || undefined,
        max_participants: formData.max_participants as 8 | 16,
        platform: formData.platform!,
        start_at: startAt.toISOString(),
        registration_deadline: regDeadline.toISOString(),
        check_in_required: formData.check_in_required!,
        check_in_deadline: formData.check_in_required && checkInDeadline
          ? checkInDeadline.toISOString()
          : regDeadline.toISOString(), // Fallback if not required
        rules: formData.rules || undefined,
        discord_link: formData.discord_link || undefined,
      }

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/tournaments/${data.tournament.id}`)
      } else {
        setError(data.error || 'Failed to create tournament')
      }
    } catch (err) {
      setError('An error occurred while creating the tournament')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Game Selection */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Game *
        </label>
        <GameSearch
          onSelect={(game) => {
            setSelectedGame({ id: game.id.toString(), name: game.name })
          }}
        />
        {selectedGame && (
          <p className="mt-2 text-sm text-slate-400">
            Selected: <span className="text-white">{selectedGame.name}</span>
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Tournament Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          maxLength={100}
          required
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={1000}
          rows={4}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 resize-none"
        />
      </div>

      {/* Max Participants */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Max Participants *
        </label>
        <select
          value={formData.max_participants}
          onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) as 8 | 16 })}
          required
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        >
          <option value={8}>8 Players</option>
          <option value={16}>16 Players</option>
        </select>
      </div>

      {/* Platform */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Platform *
        </label>
        <select
          value={formData.platform}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          required
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        >
          <option value="pc">PC</option>
          <option value="ps">PlayStation</option>
          <option value="xbox">Xbox</option>
          <option value="switch">Switch</option>
          <option value="mobile">Mobile</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Start Date & Time *
        </label>
        <input
          type="datetime-local"
          value={dates.start_at}
          onChange={(e) => setDates({ ...dates, start_at: e.target.value })}
          required
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Registration Deadline */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Registration Deadline *
        </label>
        <input
          type="datetime-local"
          value={dates.registration_deadline}
          onChange={(e) => setDates({ ...dates, registration_deadline: e.target.value })}
          required
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />
        <p className="mt-1 text-xs text-slate-500">
          Must be before start time
        </p>
      </div>

      {/* Check-in Required */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.check_in_required}
            onChange={(e) => setFormData({ ...formData, check_in_required: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm font-title uppercase text-white">
            Require Check-in
          </span>
        </label>
      </div>

      {/* Check-in Deadline */}
      {formData.check_in_required && (
        <div>
          <label className="block text-sm font-title uppercase text-white mb-2">
            Check-in Deadline *
          </label>
          <input
            type="datetime-local"
            value={dates.check_in_deadline}
            onChange={(e) => setDates({ ...dates, check_in_deadline: e.target.value })}
            required={formData.check_in_required}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            Must be between registration deadline and start time
          </p>
        </div>
      )}

      {/* Rules */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Rules
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          maxLength={2000}
          rows={6}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 resize-none"
          placeholder="Tournament rules, format, scoring, etc."
        />
      </div>

      {/* Discord Link */}
      <div>
        <label className="block text-sm font-title uppercase text-white mb-2">
          Discord Link
        </label>
        <input
          type="url"
          value={formData.discord_link}
          onChange={(e) => setFormData({ ...formData, discord_link: e.target.value })}
          placeholder="https://discord.gg/..."
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Tournament'
          )}
        </button>
      </div>
    </form>
  )
}

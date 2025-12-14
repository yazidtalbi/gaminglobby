'use client'

import { useState, useEffect } from 'react'
import { TournamentWithHost } from '@/types/tournaments'
import { Loader2 } from 'lucide-react'

interface StartTournamentButtonProps {
  tournament: TournamentWithHost
  onSuccess: () => void
}

export function StartTournamentButton({ tournament, onSuccess }: StartTournamentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    if (!confirm('Are you sure you want to start this tournament? This will generate the bracket and cannot be undone.')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/start`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Failed to start tournament')
      }
    } catch (err) {
      setError('An error occurred while starting the tournament')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch checked-in count
  const [checkedInCount, setCheckedInCount] = useState<number | null>(null)

  // Fetch checked-in count on mount
  useEffect(() => {
    fetch(`/api/tournaments/${tournament.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.participants) {
          const checkedIn = data.participants.filter((p: any) => p.status === 'checked_in').length
          setCheckedInCount(checkedIn)
        }
      })
      .catch(() => {})
  }, [tournament.id])

  const canStart = checkedInCount === tournament.max_participants

  return (
    <div>
      {checkedInCount !== null && (
        <div className="mb-4">
          <p className="text-slate-400 mb-2">
            Start the tournament to generate the bracket. You need exactly {tournament.max_participants} checked-in participants.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Currently checked in: <span className={`font-semibold ${canStart ? 'text-green-400' : 'text-yellow-400'}`}>{checkedInCount}/{tournament.max_participants}</span>
            </span>
          </div>
          {!canStart && (
            <p className="text-sm text-yellow-400 mt-2">
              Waiting for {tournament.max_participants - checkedInCount} more participant{tournament.max_participants - checkedInCount > 1 ? 's' : ''} to check in.
            </p>
          )}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={isLoading || (checkedInCount !== null && !canStart)}
        className="px-6 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting Tournament...
          </>
        ) : (
          'Start Tournament'
        )}
      </button>
    </div>
  )
}

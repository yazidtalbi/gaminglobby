'use client'

import { useState } from 'react'
import { TournamentWithHost } from '@/types/tournaments'
import { Loader2 } from 'lucide-react'

interface TournamentRegistrationPanelProps {
  tournament: TournamentWithHost
  userParticipation: {
    is_registered: boolean
    is_checked_in: boolean
    status: string | null
  } | null
  onUpdate: () => void
}

export function TournamentRegistrationPanel({
  tournament,
  userParticipation,
  onUpdate,
}: TournamentRegistrationPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRegistrationOpen = tournament.status === 'open' && 
    new Date(tournament.registration_deadline) > new Date()
  const isFull = tournament.current_participants >= tournament.max_participants
  const canRegister = isRegistrationOpen && !isFull && !userParticipation?.is_registered

  const handleRegister = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        onUpdate()
      } else {
        setError(data.error || 'Failed to register')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/check-in`, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        onUpdate()
      } else {
        setError(data.error || 'Failed to check in')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw from this tournament?')) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/withdraw`, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        onUpdate()
      } else {
        setError(data.error || 'Failed to withdraw')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userParticipation) {
    return null
  }

  return (
    <div className="mb-8 bg-slate-800/30 border border-slate-700/50 p-4">
      <h2 className="text-lg font-title text-white mb-4">Registration</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      {canRegister && (
        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="px-6 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering...
            </span>
          ) : (
            'Register'
          )}
        </button>
      )}

      {userParticipation.is_registered && !userParticipation.is_checked_in && tournament.check_in_required && (
        <div>
          <p className="text-slate-400 mb-3">
            You are registered. Check-in is required before the tournament starts.
          </p>
          <button
            onClick={handleCheckIn}
            disabled={isLoading || new Date(tournament.check_in_deadline) < new Date()}
            className="px-6 py-3 bg-green-500 text-white font-title font-bold uppercase hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking in...
              </span>
            ) : (
              'Check In'
            )}
          </button>
        </div>
      )}

      {userParticipation.is_checked_in && (
        <div>
          <p className="text-green-400 mb-3">✓ You are checked in and ready to compete!</p>
        </div>
      )}

      {userParticipation.is_registered && tournament.status === 'open' && (
        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="mt-4 px-6 py-3 bg-red-500/20 text-red-400 font-title font-bold uppercase hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Withdrawing...
            </span>
          ) : (
            'Withdraw'
          )}
        </button>
      )}
    </div>
  )
}

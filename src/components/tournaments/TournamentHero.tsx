'use client'

import { useState, useEffect } from 'react'
import { TournamentWithHost, TournamentParticipant } from '@/types/tournaments'
import { TournamentState } from '@/lib/tournaments/state'
import { Calendar, Clock, UserCheck, Users, Gamepad2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TournamentRegistrationPanel } from './TournamentRegistrationPanel'
import { RewardsStrip } from './RewardsStrip'

interface TournamentHeroProps {
  tournament: TournamentWithHost
  tournamentState: TournamentState
  participants: TournamentParticipant[]
  matches: any[]
  userParticipation: {
    is_registered: boolean
    is_checked_in: boolean
    status: string | null
  } | null
  onUpdate: () => void
  user: { id: string } | null
}

export function TournamentHero({
  tournament,
  tournamentState,
  participants,
  matches,
  userParticipation,
  onUpdate,
  user,
}: TournamentHeroProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkedInCount = participants.filter(p => p.status === 'checked_in').length

  // Get current round for live tournaments (highest round with in_progress matches)
  const currentRound = tournamentState === 'live' && matches.length > 0
    ? (() => {
        const inProgressMatches = matches.filter(m => m.status === 'in_progress' || m.status === 'pending')
        if (inProgressMatches.length > 0) {
          return Math.max(...inProgressMatches.map(m => m.round_number))
        }
        // If no in-progress matches, return the highest round
        return Math.max(...matches.map(m => m.round_number))
      })()
    : null

  return (
    <div className="mb-8">
      {/* Cover Image */}
      {tournament.cover_url && (
        <div className="w-full h-48 mb-6 overflow-hidden rounded-lg">
          <img
            src={tournament.cover_url}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Tournament Info */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-title text-white mb-2">{tournament.title}</h1>
              <div className="flex items-center gap-3 text-slate-400 mb-4">
                <Gamepad2 className="w-4 h-4" />
                <span>{tournament.game_name}</span>
                <span className="text-slate-600">•</span>
                <span className="uppercase">{tournament.platform}</span>
                <span className="text-slate-600">•</span>
                <Users className="w-4 h-4" />
                <span>{tournament.current_participants}/{tournament.max_participants}</span>
              </div>
            </div>
            {/* Status Badge */}
            <Badge
              variant={
                tournamentState === 'completed'
                  ? 'success'
                  : tournamentState === 'live'
                  ? 'warning'
                  : 'info'
              }
              className="text-sm font-title uppercase px-4 py-2"
            >
              {tournamentState === 'completed'
                ? 'COMPLETED'
                : tournamentState === 'live'
                ? 'LIVE'
                : 'UPCOMING'}
            </Badge>
          </div>

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6 pb-6 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(tournament.start_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                {new Date(tournament.start_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                Registration: {new Date(tournament.registration_deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {tournament.check_in_required && (
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>
                  Check-in: {new Date(tournament.check_in_deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Registration Status Messages */}
          {mounted && tournamentState === 'live' && user && userParticipation?.is_checked_in && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 font-semibold mb-1">You&apos;re checked in and ready to compete!</p>
              <p className="text-sm text-slate-400">Matches are in progress. Check the bracket below.</p>
            </div>
          )}

          {tournamentState === 'completed' && (
            <div className="mt-4">
              <Link href={`/tournaments/${tournament.id}/matches`}>
                <Button variant="outline" className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10">
                  View All Matches
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Side - Rewards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Rewards Section */}
          <RewardsStrip tournament={tournament} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TournamentCard } from '@/components/tournaments/TournamentCard'
import { TournamentsPageSkeleton } from '@/components/TournamentsPageSkeleton'
import { TournamentWithHost } from '@/types/tournaments'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'

export default function TournamentsPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [tournaments, setTournaments] = useState<TournamentWithHost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const isPro = profile && (
    profile.plan_tier === 'pro' || profile.plan_tier === 'founder'
  ) && (
    !profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date()
  )

  useEffect(() => {
    fetchTournaments()
  }, [statusFilter])

  const fetchTournaments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/tournaments?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-title text-white">Tournaments</h1>
            {isPro && (
              <Link
                href="/tournaments/create"
                className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase hover:bg-cyan-300 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Tournament
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-title uppercase ${
                statusFilter === 'all'
                  ? 'bg-cyan-400 text-slate-900'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-4 py-2 text-sm font-title uppercase ${
                statusFilter === 'open'
                  ? 'bg-cyan-400 text-slate-900'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-4 py-2 text-sm font-title uppercase ${
                statusFilter === 'in_progress'
                  ? 'bg-cyan-400 text-slate-900'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 text-sm font-title uppercase ${
                statusFilter === 'completed'
                  ? 'bg-cyan-400 text-slate-900'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {isLoading ? (
          <TournamentsPageSkeleton />
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No tournaments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

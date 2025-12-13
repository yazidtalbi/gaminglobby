'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CreateTournamentForm } from '@/components/tournaments/CreateTournamentForm'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile) {
      const isProUser = profile.plan_tier === 'pro' || profile.plan_tier === 'founder'
      const isProActive = isProUser && (
        !profile.plan_expires_at || 
        new Date(profile.plan_expires_at) > new Date()
      )
      setIsPro(isProActive)

      if (!isProActive) {
        // Redirect non-Pro users
        router.push('/billing')
      }
    } else if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, profile, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (!isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Pro subscription required to create tournaments</p>
          <Link
            href="/billing"
            className="px-6 py-3 bg-cyan-400 text-slate-900 font-title font-bold uppercase hover:bg-cyan-300 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/tournaments"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-title uppercase mb-4 inline-block"
          >
            ← Back to Tournaments
          </Link>
          <h1 className="text-3xl font-title text-white">Create Tournament</h1>
          <p className="text-slate-400 mt-2">Organize a competitive gaming tournament for your community</p>
        </div>

        <CreateTournamentForm />
      </div>
    </div>
  )
}

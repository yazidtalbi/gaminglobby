'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isPro } from '@/lib/premium'
import { useRouter } from 'next/navigation'
import { Check, Star } from '@mui/icons-material'

export default function BillingPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const userIsPro = isPro(profile)

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-title text-white mb-8">Billing & Subscription</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Free Plan */}
          <div className={`bg-slate-800 border-2 ${userIsPro ? 'border-slate-700' : 'border-cyan-400'} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-title text-white">Free</h2>
              {!userIsPro && (
                <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-1 font-title">CURRENT</span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-6">$0<span className="text-lg text-slate-400">/month</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Unlimited game library</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Join lobbies & events</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Follow other players</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className={`bg-slate-800 border-2 ${userIsPro ? 'border-cyan-400' : 'border-slate-700'} p-6 relative`}>
            {userIsPro && (
              <span className="absolute top-4 right-4 text-xs bg-cyan-400/20 text-cyan-400 px-2 py-1 font-title">CURRENT</span>
            )}
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-title text-white">Pro</h2>
            </div>
            <div className="text-3xl font-bold text-white mb-6">$9.99<span className="text-lg text-slate-400">/month</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Everything in Free</span>
              </li>
              {/* Temporarily hidden - will be enabled later */}
              {/* <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Unlimited collections</span>
              </li> */}
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Create & feature events</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Auto-invite system</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Lobby boosts</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Profile banners & themes</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Library insights</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Advanced filters</span>
              </li>
            </ul>
            {!userIsPro && (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            )}
            {userIsPro && (
              <div className="text-center text-slate-400 text-sm">
                Active until {profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString() : 'indefinitely'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


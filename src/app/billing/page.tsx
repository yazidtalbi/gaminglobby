'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isPro } from '@/lib/premium'
import { useRouter } from 'next/navigation'
import { Check, Star, Close } from '@mui/icons-material'

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

  const userIsPro = profile && (
    (profile.plan_tier === 'pro' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ||
    profile.plan_tier === 'founder'
  )

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-left">
          <h1 className="text-5xl font-title text-white mb-4">Billing & Subscription</h1>
          <p className="text-lg text-slate-300 max-w-xl">
            Stay organized with Apoxer's free version as long as you like – or upgrade to Apex to unlock all features and enhance your gaming experience.
          </p>
        </div>

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
                <span>Create & join lobbies</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Join events</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Follow other players</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Real-time chat</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Browse games & communities</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>View recent players</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Customize profile</span>
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
              <h2 className="text-xl font-title text-white">Apex</h2>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              $4.99<span className="text-lg text-slate-400">/month</span>
            </div>
            <div className="text-sm text-slate-400 mb-6">
              Per month / $49.99 Annually
            </div>
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
                <span>Profile banners & themes</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Create tournaments</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Early access to new features</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-cyan-400" />
                <span>Priority assistance</span>
              </li>
            </ul>
            {!userIsPro && (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Upgrade to Apex'}
              </button>
            )}
            {userIsPro && (
              <div className="text-center text-slate-400 text-sm">
                Active until {profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'indefinitely'}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">Compare Plans</h2>
          <div className="bg-slate-800 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/30">
                    <th className="text-left p-4 text-white font-title">Feature</th>
                    <th className="text-center p-4 text-white font-title">Free</th>
                    <th className="text-center p-4 text-white font-title">Apex</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/30">
                  <tr>
                    <td className="p-4 text-slate-300">Game Library</td>
                    <td className="p-4 text-center text-slate-300">Unlimited</td>
                    <td className="p-4 text-center text-slate-300">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Join Lobbies</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Create Lobbies</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Join Events</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Follow Players</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Create Events</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Auto-Invite System</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Profile Banners</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Apex Badge</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Real-Time Chat</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Browse Games & Communities</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">View Recent Players</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Customize Profile</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Create Tournaments</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Collections <span className="text-xs text-slate-500">(Coming Soon)</span></td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Early Access to New Features</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Priority Assistance</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">SSL Encryption</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


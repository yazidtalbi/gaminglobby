'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, LogIn, Gamepad2, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user has completed onboarding (has games in library)
      if (data.user) {
        const { data: userGames, error: gamesError } = await supabase
          .from('user_games')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1)

        // If no games found, redirect to onboarding
        if (!gamesError && (!userGames || userGames.length === 0)) {
          router.push('/onboarding')
          router.refresh()
          return
        }
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-app-green-500/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 text-app-green-400">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-app-green-500 to-cyan-500 flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">Apoxer</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 mb-6">Sign in to continue to Apoxer</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full flex items-center justify-center gap-2 px-6 py-3 mt-8 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-cyan-400 font-title uppercase tracking-wider transition-colors group"
            >
              {/* Bracket border corners */}
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
              
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                <>
                  &gt; SIGN IN
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <Link
              href="/auth/register"
              className="relative w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-title uppercase tracking-wider transition-colors group"
            >
              {/* Bracket border corners */}
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
              
              &gt; CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


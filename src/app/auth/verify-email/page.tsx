'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Gamepad2, Mail, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user is already confirmed
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // User is logged in, redirect to onboarding
        router.push('/onboarding')
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Listen for auth state changes (when user confirms email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.push('/onboarding')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (error) {
      console.error('Failed to resend email:', error)
    } finally {
      setIsResending(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
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
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-slate-400 text-sm">
              We&apos;ve sent a confirmation link to
            </p>
            {email && (
              <p className="text-cyan-400 font-medium mt-1">{email}</p>
            )}
          </div>

          <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-300 mb-2">
              Click the confirmation link in the email to activate your account and continue to onboarding.
            </p>
            <p className="text-xs text-slate-400">
              Didn&apos;t receive the email? Check your spam folder or try resending.
            </p>
          </div>

          {email && (
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending || resendSuccess}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-title transition-colors rounded-lg"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : resendSuccess ? (
                  'Email sent!'
                ) : (
                  'Resend confirmation email'
                )}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}


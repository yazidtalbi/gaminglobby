'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Refresh from '@mui/icons-material/Refresh'
import Link from 'next/link'

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const sessionId = searchParams.get('session_id')

  // Check if user is already Pro from profile
  const userIsPro = profile?.plan_tier === 'pro'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    // If user is already Pro, skip verification
    if (userIsPro) {
      setIsPro(true)
      setIsVerifying(false)
      return
    }

    // Check if we've already processed this session (prevents infinite reload)
    const processedKey = `billing_success_${sessionId}`
    const alreadyProcessed = sessionStorage.getItem(processedKey)

    if (sessionId && user && !alreadyProcessed) {
      // Immediately verify and update subscription status
      const checkProStatus = async () => {
        try {
          const response = await fetch('/api/billing/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          const data = await response.json()
          
          if (data.error) {
            console.error('Error verifying session:', data.error)
            setIsVerifying(false)
          } else {
            setIsPro(data.isPro || false)
            
            // Mark this session as processed
            sessionStorage.setItem(processedKey, 'true')
            
            // Only reload once if we just updated the subscription
            if (data.updated) {
              // Small delay before reload to show success message
              setTimeout(() => {
                window.location.reload()
              }, 1000)
              return
            }
            
            setIsVerifying(false)
          }
        } catch (error) {
          console.error('Error verifying session:', error)
          setIsVerifying(false)
        }
      }
      
      // Check immediately
      checkProStatus()
    } else {
      setIsVerifying(false)
    }
  }, [sessionId, user, loading, router, userIsPro, profile])

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Refresh className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verifying your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/50 border border-slate-700/50 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-title text-white mb-4">Payment Successful!</h1>
          <p className="text-slate-300 mb-6">
            {isPro 
              ? "Your Pro subscription is now active. Enjoy all premium features!"
              : "Your payment is being processed. Your Pro subscription will be activated shortly."}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/billing"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-title transition-colors relative"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
              <span className="relative z-10">View Billing</span>
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors relative"
            >
              {/* Corner brackets */}
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
              <span className="relative z-10">Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


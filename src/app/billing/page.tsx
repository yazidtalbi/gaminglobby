'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isPro } from '@/lib/premium'
import { useRouter } from 'next/navigation'
import { Check, Star, Close, ExpandMore } from '@mui/icons-material'

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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const faqs = [
    {
      question: "Is there a trial period for the Pro subscription?",
      answer: "Yes! When you upgrade to Pro, you can start using all premium features immediately. If you're not satisfied, you can cancel anytime during your billing period and your Pro features will remain active until the end of the billing cycle."
    },
    {
      question: "Are my payments secure?",
      answer: "Absolutely. All payments are processed securely through Stripe, a leading payment processor trusted by millions of businesses worldwide. We never store your credit card information on our servers. All payment data is encrypted and handled by Stripe's secure infrastructure."
    },
    {
      question: "I'm from Europe. Do I have to pay VAT?",
      answer: "VAT (Value Added Tax) may apply depending on your location and local tax regulations. Stripe automatically calculates and adds applicable taxes during checkout based on your billing address. The final price shown during checkout includes all applicable taxes."
    },
    {
      question: "What kind of payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through Stripe. Payment methods vary by country, and Stripe will show you the available options during checkout."
    },
    {
      question: "I can't pay for your service because the payment fails. What to do?",
      answer: "If your payment fails, please check: 1) Your card has sufficient funds, 2) Your card hasn't expired, 3) Your billing address matches your card's registered address, 4) Your bank isn't blocking the transaction. If issues persist, contact your bank or try a different payment method. You can also contact our support team for assistance."
    },
    {
      question: "Can I cancel my subscription at any time?",
      answer: "Yes, you can cancel your Pro subscription at any time from your account settings. Your Pro features will remain active until the end of your current billing period. After cancellation, you'll automatically revert to the Free plan when your subscription expires."
    },
    {
      question: "Where can I find my invoices?",
      answer: "Invoices are automatically sent to your registered email address after each successful payment. You can also access your billing history and download invoices from your account settings page or by contacting our support team."
    }
  ]

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-left">
          <h1 className="text-5xl font-title text-white mb-4">Billing & Subscription</h1>
          <p className="text-xl text-slate-300">
            Stay organized with Apoxer's free version as long as you like – or upgrade to Pro to unlock all features and enhance your gaming experience.
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
                {isLoading ? 'Processing...' : 'Start free trial'}
              </button>
            )}
            {userIsPro && (
              <div className="text-center text-slate-400 text-sm">
                Active until {profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString() : 'indefinitely'}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">Compare Plans</h2>
          <div className="bg-slate-800 border border-cyan-500/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/30">
                    <th className="text-left p-4 text-white font-title">Feature</th>
                    <th className="text-center p-4 text-white font-title">Free</th>
                    <th className="text-center p-4 text-white font-title">Pro</th>
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
                    <td className="p-4 text-slate-300">Real-Time Chat</td>
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
                    <td className="p-4 text-slate-300">Pro Badge</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Lobby Boosts</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Advanced Filters</td>
                    <td className="p-4 text-center"><Close className="w-5 h-5 text-red-400 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Collections <span className="text-xs text-slate-500">(Coming Soon)</span></td>
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

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-800 border border-cyan-500/30">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-white font-title">{faq.question}</span>
                  <ExpandMore className={`w-5 h-5 text-slate-400 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {expandedFaq === index && (
                  <div className="p-4 pt-0 text-slate-300 border-t border-cyan-500/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}


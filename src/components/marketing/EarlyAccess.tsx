import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Shield, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const earlyAccessBenefits = [
  'Unlimited lobby creation',
  'Access to all games',
  'Community directory access',
  'Event & tournament features',
  'Early feature access',
]

export function EarlyAccess() {
  return (
    <section className="relative z-10 py-20 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Early Access
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            Free during Early Access
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Join now and get access to everything. Plus, an exclusive &quot;Early Supporter&quot; badge on your profile.
          </p>
        </div>

        <Card className="border-cyan-500/30 bg-slate-900/80">
          <CardContent className="p-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Free Tier */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-title font-bold text-white">Early Access</h3>
                  <Badge variant="success" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Free
                  </Badge>
                </div>
                <ul className="space-y-3 mb-6">
                  {earlyAccessBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold"
                  size="lg"
                >
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
              </div>

              {/* Coming Soon Pro */}
              <div className="opacity-60">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-title font-bold text-white">Pro</h3>
                  <Badge variant="outline" className="border-slate-700 text-slate-500">
                    Coming Soon
                  </Badge>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="text-slate-500">Everything in Early Access, plus:</li>
                  <li className="text-slate-500">Priority support</li>
                  <li className="text-slate-500">Advanced filters</li>
                  <li className="text-slate-500">Custom profile features</li>
                </ul>
                <Button
                  disabled
                  variant="outline"
                  className="w-full border-slate-700 text-slate-500 cursor-not-allowed"
                  size="lg"
                >
                  Coming Soon
                </Button>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="mt-8 pt-8 border-t border-slate-800 flex items-start gap-3">
              <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white mb-1">Privacy-first</p>
                <p className="text-xs text-slate-400">
                  No spam. You control all notifications. We don&apos;t sell your data or send marketing emails.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

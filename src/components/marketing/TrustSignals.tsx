import { Shield, Zap, Users, Star, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const trustSignals = [
  {
    icon: Star,
    value: '5.0/5.0',
    label: 'User Rating',
    description: 'Community approved',
  },
  {
    icon: Zap,
    value: 'Instant',
    label: 'Matchmaking',
    description: 'Join in seconds',
  },
  {
    icon: Shield,
    value: 'Secure',
    label: 'Platform',
    description: 'Privacy-first',
  },
  {
    icon: Users,
    value: 'Growing',
    label: 'Community',
    description: 'Join early access',
  },
  {
    icon: CheckCircle2,
    value: 'Free',
    label: 'Early Access',
    description: 'No credit card',
  },
]

export function TrustSignals() {
  return (
    <section className="relative z-10 py-12 lg:py-16 bg-slate-900/30 border-y border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {trustSignals.map((signal, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors text-center"
            >
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-4">
                  <signal.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-2xl font-title font-bold text-white mb-1">
                  {signal.value}
                </div>
                <div className="text-sm font-semibold text-slate-300 mb-1">
                  {signal.label}
                </div>
                <div className="text-xs text-slate-500">
                  {signal.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

import { Search, Users, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Pick a game',
    description: 'Browse thousands of games or search for your favorite. See active lobbies and community links at a glance.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Join or create',
    description: 'Join an active lobby in one click, or create your own. Set your platform, region, and what you&apos;re looking for.',
  },
  {
    number: '03',
    icon: Play,
    title: 'Play together',
    description: 'Get contacts, Discord links, and server info. Everything you need to start playing is right there.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 py-20 lg:py-32 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            How it works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Three simple steps to find players and start playing.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(100%-3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
              )}

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 mb-6 relative">
                  <step.icon className="w-8 h-8 text-cyan-400" />
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs border-cyan-500/50 text-cyan-400 bg-slate-900"
                  >
                    {step.number.slice(-1)}
                  </Badge>
                </div>
                <h3 className="text-2xl font-title font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

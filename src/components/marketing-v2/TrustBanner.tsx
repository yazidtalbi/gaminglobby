import { Star, Zap, Shield, TrendingUp, Users } from 'lucide-react'

const trustItems = [
  {
    icon: Star,
    text: '5.0/5.0',
    label: 'User Rating',
  },
  {
    icon: Zap,
    text: 'FEES AS LOW AS 0%',
    label: 'Always Free',
  },
  {
    icon: TrendingUp,
    text: 'UP TO 100%',
    label: 'Active Lobbies',
  },
  {
    icon: Users,
    text: '10K+',
    label: 'Games Indexed',
  },
  {
    icon: Shield,
    text: '100K+',
    label: 'Happy Players',
  },
]

export function TrustBanner() {
  return (
    <section className="relative z-10 py-6 bg-slate-900/50 border-y border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10">
                <item.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{item.text}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

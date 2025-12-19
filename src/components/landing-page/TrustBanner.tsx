import { Star, Zap, TrendingUp, Users, Shield } from 'lucide-react'

const trustItems = [
  {
    icon: Star,
    text: '5.0/5.0',
    label: 'USER RATING',
  },
  {
    icon: Zap,
    text: 'FEES AS LOW AS 0%',
    subtext: 'ALWAYS FREE',
  },
  {
    icon: TrendingUp,
    text: 'UP TO 100%',
    label: 'ACTIVE LOBBIES',
  },
  {
    icon: Users,
    text: '10K+',
    label: 'GAMES INDEXED',
  },
  {
    icon: Shield,
    text: '100K+',
    label: 'HAPPY PLAYERS',
  },
]

export function TrustBanner() {
  return (
    <section className="relative z-10 py-8 lg:py-12 bg-slate-900/50 border-y border-slate-800/50">
      <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-cyan-500/10">
                <item.icon className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-white">{item.text}</div>
                {item.label && (
                  <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </div>
                )}
                {item.subtext && (
                  <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                    {item.subtext}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

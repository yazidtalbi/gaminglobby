import { Users, Gamepad2, TrendingUp, Link2 } from 'lucide-react'

const stats = [
  {
    icon: Gamepad2,
    value: '500+',
    label: 'Games indexed',
    description: 'From classics to modern titles',
  },
  {
    icon: Users,
    value: 'Active',
    label: 'Lobbies now',
    description: 'Players ready to play',
  },
  {
    icon: TrendingUp,
    value: 'Growing',
    label: 'Communities linked',
    description: 'Discord, Mumble, and more',
  },
  {
    icon: Link2,
    value: 'Fast',
    label: 'Matchmaking',
    description: 'Join or create in seconds',
  },
]

export function SocialProof() {
  return (
    <section className="relative z-10 py-16 border-y border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Founder Story */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-lg text-slate-300 italic mb-2">
            &quot;Remember Hamachi, GameRanger, Xfire? We&apos;re bringing that simplicity back—but better.&quot;
          </p>
          <p className="text-sm text-slate-500">— Built for players who miss simpler times</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-4">
                <stat.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-3xl font-title font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-300 mb-1">{stat.label}</div>
              <div className="text-xs text-slate-500">{stat.description}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Numbers shown are preview metrics. Join early to help us grow.
        </p>
      </div>
    </section>
  )
}

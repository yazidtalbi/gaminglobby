import {
  Clock,
  Tags,
  Link2,
  Vote,
  UserCircle,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Clock,
    title: 'Real-time lobbies',
    description: 'Short-lived lobbies (15-min style) that expire after inactivity. See who&apos;s ready to play right now.',
    microUI: (
      <div className="mt-4 p-2 bg-slate-800/50 rounded border border-slate-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">CS2 Ranked</span>
          <Badge variant="success" className="text-[10px]">7/10</Badge>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">Created 2m ago</div>
      </div>
    ),
  },
  {
    icon: Tags,
    title: 'Player intent & tags',
    description: 'See play style, region, and what players are looking for. Match faster with compatible teammates.',
    microUI: (
      <div className="mt-4 flex flex-wrap gap-1">
        {['Competitive', 'EU', 'Mic req'].map((tag, i) => (
          <Badge key={i} variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
            {tag}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    icon: Link2,
    title: 'Game directories',
    description: 'Find community links, Discord servers, guides, and more—all organized per game. No more scattered bookmarks.',
    microUI: (
      <div className="mt-4 space-y-1 text-xs">
        {['Discord Server', 'Mumble Server', 'Game Guide'].map((link, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 cursor-pointer">
            <div className="w-1 h-1 rounded-full bg-cyan-400" />
            {link}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Vote,
    title: 'Events & votes',
    description: 'Weekly community votes to revive old games. See upcoming events and tournaments organized by the community.',
    microUI: (
      <div className="mt-4 p-2 bg-slate-800/50 rounded border border-slate-700/50">
        <div className="text-xs text-white mb-1">This week&apos;s vote</div>
        <div className="text-[10px] text-slate-400">Battlefield 3 vs Left 4 Dead 2</div>
        <div className="flex gap-1 mt-2">
          <div className="h-1 flex-1 bg-cyan-500/30 rounded" style={{ width: '60%' }} />
          <div className="h-1 flex-1 bg-slate-700 rounded" style={{ width: '40%' }} />
        </div>
      </div>
    ),
  },
  {
    icon: UserCircle,
    title: 'Lightweight profiles',
    description: 'Simple profiles focused on gaming. Find reliable teammates without social media noise.',
    microUI: (
      <div className="mt-4 p-2 bg-slate-800/50 rounded border border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-slate-700" />
          <div>
            <div className="text-xs font-medium text-white">Player123</div>
            <div className="text-[10px] text-slate-500">EU • PC</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Bell,
    title: 'Smart notifications',
    description: 'Opt-in notifications for lobbies, events, and community updates. You control what you see.',
    microUI: (
      <div className="mt-4 space-y-1 text-xs">
        {['New lobby', 'Event starting', 'Friend joined'].map((notif, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {notif}
          </div>
        ))}
      </div>
    ),
  },
]

export function Features() {
  return (
    <section id="features" className="relative z-10 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            Everything you need to find players
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Built for multiplayer gaming, without the fluff.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors"
            >
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">{feature.title}</CardTitle>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </CardHeader>
              <CardContent>{feature.microUI}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

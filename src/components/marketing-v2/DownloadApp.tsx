import { Button } from '@/components/ui/button'
import { Shield, Zap, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    text: 'BOT PROTECTION',
  },
  {
    icon: Users,
    text: '1.3M+ PLAYERS',
  },
  {
    icon: TrendingUp,
    text: '107K+ LOBBIES',
  },
  {
    icon: Zap,
    text: 'INSTANT MATCH',
  },
]

export function DownloadApp() {
  return (
    <section className="relative z-10 py-16 lg:py-24 bg-gradient-to-br from-cyan-600/20 via-purple-600/20 to-pink-600/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
              DOWNLOAD APOXER APPLICATION
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              FAST & SECURE MATCHMAKING ON THE GO
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white px-8"
              >
                App Store
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white px-8"
              >
                Google Play
              </Button>
            </div>
          </div>

          {/* Right: Phone Mockup Placeholder */}
          <div className="relative">
            <div className="aspect-[9/16] max-w-[300px] mx-auto bg-slate-900 rounded-[2.5rem] border-8 border-slate-800 p-4 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="text-white font-semibold">Apoxer</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features Strip */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 text-center"
            >
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-3">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-sm font-semibold text-white">
                  {feature.text}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

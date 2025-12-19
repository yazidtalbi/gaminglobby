import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Code, Zap, TrendingUp } from 'lucide-react'

export function TradeLikePro() {
  return (
    <section className="relative z-10 py-16 lg:py-24 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            MATCH LIKE A PRO
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Unlock the full potential of your matchmaking strategy with our API (Coming Soon)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main API Card */}
          <Card className="lg:col-span-1 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div>
                <div className="text-6xl font-bold text-cyan-400 mb-4">API</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Developer Documentation
                </h3>
                <p className="text-slate-300 mb-6">
                  Access all essential API documentation for automated lobby management and player matching.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                disabled
              >
                COMING SOON
              </Button>
            </CardContent>
          </Card>

          {/* Right: Feature Cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      Automated Lobby Management
                    </h4>
                    <p className="text-slate-400">
                      Programmatically create, manage, and monitor lobbies. Integrate matchmaking into your own applications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      Real-Time Activity Data
                    </h4>
                    <p className="text-slate-400">
                      Get live updates on lobby status, player activity, and game statistics. Build dashboards and analytics tools.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

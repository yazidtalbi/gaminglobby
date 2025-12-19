import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'
import { HeroCarousel } from '@/components/landing/HeroCarousel'
import { TrustStats } from '@/components/landing/TrustStats'
import type { ActivityResponse } from '@/lib/activity/getActivity'

interface HeroProps {
  activity: ActivityResponse
}

export function Hero({ activity }: HeroProps) {
  return (
    <section className="relative z-10 pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left: Headline + CTAs */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                Early Access
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-title font-bold text-white mb-6 leading-tight">
              FIND PLAYERS.
              <br />
              <span className="text-cyan-400">JOIN LOBBIES.</span>
              <br />
              DISCOVER COMMUNITIES.
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              Real-time lobbies and player intent — without hunting across dead links.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button
                asChild
                size="lg"
                className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-title font-semibold text-base px-8 shadow-lg shadow-cyan-500/20"
              >
                <Link href="/games">
                  Browse Games
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 font-title text-base px-8"
              >
                <Link href="/games">
                  <Plus className="mr-2 w-5 h-5" />
                  Create a Lobby
                </Link>
              </Button>
            </div>

            <p className="text-sm text-slate-400 mb-8">
              No Discord hunting. See who&apos;s active right now.
            </p>

            {/* Trust Stats */}
            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <TrustStats
                gamesIndexed={activity.stats.gamesIndexed}
                lobbies7d={activity.stats.lobbies7d}
                activePlayers7d={activity.stats.activePlayers7d}
              />
            </div>
          </div>

          {/* Right: Hero Carousel */}
          <div className="relative">
            <HeroCarousel activity={activity} />
          </div>
        </div>
      </div>
    </section>
  )
}

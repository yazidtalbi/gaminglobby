import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ActivityResponse } from '@/lib/activity/getActivity'
import { HeroCarousel } from '@/components/landing/HeroCarousel'

interface HeroSectionProps {
  activity: ActivityResponse
}

export function HeroSection({ activity }: HeroSectionProps) {
  return (
    <section className="relative z-10 pt-12 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 items-start">
          {/* Left Side: Headline & CTA */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                Early Access
              </span>
            </div>

            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-title font-bold text-white mb-6 leading-tight">
              FIND PLAYERS.
              <br />
              <span className="text-cyan-400">JOIN LOBBIES.</span>
              <br />
              DISCOVER COMMUNITIES.
            </h1>

            <p className="text-xl lg:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Real-time lobbies and player intent — without hunting across dead links. See who&apos;s active right now.
            </p>

            <Button
              asChild
              size="lg"
              className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-title font-semibold text-lg px-10 py-6 h-auto shadow-lg shadow-cyan-500/30"
            >
              <Link href="/games">
                Browse Games
                <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
            </Button>
          </div>

          {/* Right Side: Hero Carousel */}
          <div className="relative">
            <HeroCarousel activity={activity} />
          </div>
        </div>
      </div>
    </section>
  )
}

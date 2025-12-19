'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ActivityResponse } from '@/lib/activity/getActivity'

interface HeroCarouselProps {
  activity: ActivityResponse
}

const featuredPromos = [
  {
    title: 'Complete Missions',
    subtitle: 'Get rewards each week',
    description: 'Join weekly community events and unlock exclusive profile badges.',
    gradient: 'from-cyan-500/20 to-purple-500/20',
  },
  {
    title: 'Find Your Squad',
    subtitle: 'Match instantly',
    description: 'Connect with players who share your play style and region.',
    gradient: 'from-green-500/20 to-cyan-500/20',
  },
  {
    title: 'Discover Communities',
    subtitle: 'Link to Discord & more',
    description: 'Find active game communities, Discord servers, and resources.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
]

export function HeroCarousel({ activity }: HeroCarouselProps) {
  const [currentPromo, setCurrentPromo] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % featuredPromos.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const nextPromo = () => {
    setCurrentPromo((prev) => (prev + 1) % featuredPromos.length)
  }

  const prevPromo = () => {
    setCurrentPromo((prev) => (prev - 1 + featuredPromos.length) % featuredPromos.length)
  }

  const current = featuredPromos[currentPromo]

  // Get first 8 items for live feed
  const liveItems = activity.lobbies.slice(0, 8)

  return (
    <div className="w-full space-y-4">
      {/* Featured Promo Block */}
      <div className={`relative h-48 rounded-lg border border-cyan-500/20 bg-gradient-to-br ${current.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="relative h-full flex items-center justify-between p-6">
          <div className="flex-1">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              {current.subtitle}
            </div>
            <h3 className="text-2xl font-title font-bold text-white mb-2">
              {current.title}
            </h3>
            <p className="text-sm text-slate-300 max-w-md">
              {current.description}
            </p>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevPromo}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={nextPromo}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {featuredPromos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPromo(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPromo
                  ? 'bg-cyan-400 w-6'
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Live Lobbies
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400">
              {activity.mode === 'live' ? 'Live' : 'Sample'}
            </span>
          </div>
        </div>

        <div className="relative max-h-[320px] overflow-y-auto">
          {/* Gradient fade */}
          <div className="sticky bottom-0 h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10" />
          
          <div className="divide-y divide-slate-800/50">
            {liveItems.map((item) => {
              const isNew = item.recency === 'Just now' || (item.recency && item.recency.endsWith('m ago'))
              const minutesMatch = item.recency?.match(/(\d+)m ago/)
              const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 999

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 p-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isNew && minutes <= 5 && !item.is_demo
                          ? 'bg-green-400 animate-pulse'
                          : item.is_demo
                          ? 'bg-slate-600'
                          : 'bg-cyan-400'
                      }`}
                    />
                    {isNew && minutes <= 5 && !item.is_demo && (
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate mb-0.5">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="truncate">{item.game_name}</span>
                      {item.platform && (
                        <>
                          <span>•</span>
                          <span>{item.platform}</span>
                        </>
                      )}
                      {item.region && (
                        <>
                          <span>•</span>
                          <span>{item.region}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{item.players}</span>
                    </div>
                  </div>

                  {!item.is_demo && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300"
                    >
                      <Link href={`/lobbies/${item.id}`}>
                        <Plus className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

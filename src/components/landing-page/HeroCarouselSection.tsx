'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'
import type { ActivityResponse } from '@/lib/activity/getActivity'

interface HeroCarouselSectionProps {
  activity: ActivityResponse
}

const carouselSlides = [
  {
    title: 'REAL-TIME LOBBIES',
    subtitle: 'Find players instantly',
    description: 'Short-lived lobbies (15-min style) that expire after inactivity. See who\'s ready to play right now.',
    bgGradient: 'from-cyan-600/20 to-purple-600/20',
  },
  {
    title: 'PLAYER INTENT & TAGS',
    subtitle: 'Match faster',
    description: 'See play style, region, and what players are looking for. Match faster with compatible teammates.',
    bgGradient: 'from-green-600/20 to-cyan-600/20',
  },
  {
    title: 'GAME DIRECTORIES',
    subtitle: 'Everything organized',
    description: 'Find community links, Discord servers, guides, and more—all organized per game. No more scattered bookmarks.',
    bgGradient: 'from-purple-600/20 to-pink-600/20',
  },
  {
    title: 'EVENTS & VOTES',
    subtitle: 'Community driven',
    description: 'Weekly community votes to revive old games. See upcoming events and tournaments organized by the community.',
    bgGradient: 'from-orange-600/20 to-red-600/20',
  },
  {
    title: 'LIGHTWEIGHT PROFILES',
    subtitle: 'Focused on gaming',
    description: 'Simple profiles focused on gaming. Find reliable teammates without social media noise.',
    bgGradient: 'from-blue-600/20 to-indigo-600/20',
  },
  {
    title: 'SMART NOTIFICATIONS',
    subtitle: 'You control what you see',
    description: 'Opt-in notifications for lobbies, events, and community updates. You control what you see.',
    bgGradient: 'from-teal-600/20 to-cyan-600/20',
  },
]

export function HeroCarouselSection({ activity }: HeroCarouselSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleLobbies, setVisibleLobbies] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 5000) // Auto-advance every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Show lobbies one by one with 1 second interval
  useEffect(() => {
    const recentLobbies = activity.lobbies.slice(0, 12)
    setVisibleLobbies([])
    
    recentLobbies.forEach((_, index) => {
      setTimeout(() => {
        setVisibleLobbies((prev) => [...prev, index])
      }, index * 1000) // Show one every 1 second
    })
  }, [activity.lobbies])

  const currentSlideData = carouselSlides[currentSlide]
  const recentLobbies = activity.lobbies.slice(0, 12)

  return (
    <section className="relative z-10 pt-12 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 items-start">
          {/* Left: Autoplay Carousel - Practically No Padding */}
          <div className="relative h-[500px] lg:h-[600px] rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgGradient} transition-all duration-700`}
              key={`gradient-${currentSlide}`}
            >
              <div className="absolute inset-0 bg-slate-900/30" />
            </div>
            
            {/* Carousel Indicators (dots) - Top Left */}
            <div className="absolute top-2 left-2 z-20 flex gap-1.5">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1 transition-all duration-300 ${
                    idx <= currentSlide
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            
            {/* Content - Practically No Padding */}
            <div className="relative z-10 h-full flex flex-col justify-between p-2 lg:p-3">
              <div className="flex-1 flex flex-col justify-center min-h-0">
                <h1 className="text-3xl lg:text-5xl xl:text-6xl font-title font-bold text-white mb-2 lg:mb-3 leading-tight">
                  {currentSlideData.title}
                </h1>
                <p className="text-sm lg:text-base text-slate-200 mb-3 lg:mb-4 max-w-xl">
                  {currentSlideData.description}
                </p>
              </div>
              
              <Button
                asChild
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm lg:text-base px-4 lg:px-6 py-3 lg:py-4 h-auto w-fit rounded-full shadow-lg z-10"
              >
                <Link href="/games">
                  START MATCHMAKING
                  <ArrowRight className="ml-2 w-4 h-4 lg:w-5 lg:h-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Top CTA + Bottom Recent Lobbies */}
          <div className="flex flex-col gap-6 max-w-md h-[500px] lg:h-[600px]">
            {/* Top: Events CTA - Takes remaining height */}
            <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-800 bg-gradient-to-br from-cyan-600/20 to-purple-600/20 min-h-0">
              <div className="absolute inset-0 bg-slate-900/70" />
              <div className="relative h-full flex flex-col justify-center items-center text-center p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-title font-bold text-white mb-4 lg:mb-6">
                  UPCOMING EVENTS
                </h2>
                <p className="text-slate-300 mb-6 lg:mb-8 text-xs lg:text-sm">
                  Join community tournaments and weekly matches
                </p>
                <Button
                  asChild
                  size="sm"
                  className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold text-xs lg:text-sm px-6 py-3"
                >
                  <Link href="/events">
                    View Events
                    <ArrowRight className="ml-2 w-3 h-3 lg:w-4 lg:h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Bottom: Recent Lobbies - Horizontal Animated Feed */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <h3 className="text-xs lg:text-sm font-semibold text-white uppercase tracking-wider">
                    Live Feed
                  </h3>
                </div>
                <div className="text-[10px] lg:text-xs text-slate-400">
                  {activity.mode === 'live' ? 'Live' : 'Sample'}
                </div>
              </div>

              {/* Horizontal Scrolling Container - Limited Width */}
              <div className="relative overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 p-4">
                  {recentLobbies.map((lobby, index) => {
                    const isVisible = visibleLobbies.includes(index)
                    const isNew = lobby.recency === 'Just now' || (lobby.recency && lobby.recency.endsWith('m ago'))
                    const minutesMatch = lobby.recency?.match(/(\d+)m ago/)
                    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 999

                    return (
                      <div
                        key={lobby.id}
                        className={`flex-shrink-0 w-[180px] bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-all p-4 group ${
                          isVisible
                            ? 'opacity-100 translate-x-0 animate-slide-in'
                            : 'opacity-0 translate-x-4'
                        }`}
                        style={{
                          transitionDelay: `${index * 1000}ms`,
                          transitionDuration: '300ms',
                        }}
                      >
                        <div className="flex items-start gap-2 mb-3">
                          <div className="relative shrink-0 mt-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isNew && minutes <= 5 && !lobby.is_demo
                                  ? 'bg-green-400 animate-pulse'
                                  : lobby.is_demo
                                  ? 'bg-slate-600'
                                  : 'bg-cyan-400'
                              }`}
                            />
                            {isNew && minutes <= 5 && !lobby.is_demo && (
                              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate mb-1">
                              {lobby.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {lobby.game_name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {lobby.platform && <span>{lobby.platform}</span>}
                            {lobby.platform && lobby.region && <span>•</span>}
                            {lobby.region && <span>{lobby.region}</span>}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lobby.players}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {lobby.recency}
                          </div>
                        </div>

                        {!lobby.is_demo && (
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-full text-[9px] p-0 text-cyan-400 hover:text-cyan-300"
                          >
                            <Link href={`/lobbies/${lobby.id}`}>
                              <Plus className="w-2.5 h-2.5 mr-1" />
                              Join
                            </Link>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Gradient fade on edges */}
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900/90 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900/90 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

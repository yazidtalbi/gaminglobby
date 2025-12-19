'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Event {
  id: string
  title: string
  game_id: string
  starts_at: string
  heroUrl?: string | null
  logoUrl?: string | null
  gameName?: string
}

interface UpcomingEventsClientProps {
  events: Event[]
}

export function UpcomingEventsClient({ events }: UpcomingEventsClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (events.length <= 1) return
    
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % events.length)
        setIsTransitioning(false)
      }, 300)
    }, 5000) // Auto-advance every 5 seconds
    return () => clearInterval(interval)
  }, [events.length])

  const nextEvent = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
      setIsTransitioning(false)
    }, 300)
  }

  const prevEvent = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
      setIsTransitioning(false)
    }, 300)
  }

  const goToEvent = (index: number) => {
    if (index === currentIndex) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 300)
  }

  if (!events || events.length === 0) {
    return null
  }

  const currentEvent = events[currentIndex]

  if (!currentEvent) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <section className="relative z-10 py-12 lg:py-16 bg-slate-900/30">
      <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h2 className="text-3xl lg:text-4xl font-title font-bold text-white">
            UPCOMING EVENTS
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevEvent}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors"
              aria-label="Previous event"
            >
              <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-300" />
            </button>
            <button
              onClick={nextEvent}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors"
              aria-label="Next event"
            >
              <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-300" />
            </button>
          </div>
        </div>

        <div className="relative h-[350px] lg:h-[450px] rounded-lg overflow-hidden border border-slate-800">
          {/* Background Hero Image */}
          {currentEvent.heroUrl && (
            <div className="absolute inset-0" key={`bg-${currentEvent.id}`}>
              <Image
                src={currentEvent.heroUrl}
                alt={currentEvent.title}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
                priority={currentIndex === 0}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/50" />
            </div>
          )}
          {!currentEvent.heroUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          )}

          {/* Content Overlay */}
          <div className={`relative h-full flex flex-col justify-between p-6 lg:p-8 transition-opacity duration-500 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`} key={`content-${currentEvent.id}`}>
            <div>
              {/* Logo - Front Image */}
              {currentEvent.logoUrl && (
                <div className="mb-6 lg:mb-8">
                  <div className="relative w-40 h-20 lg:w-56 lg:h-28">
                    <Image
                      src={currentEvent.logoUrl}
                      alt={currentEvent.gameName || currentEvent.title}
                      fill
                      className="object-contain"
                      sizes="224px"
                    />
                  </div>
                </div>
              )}

              {/* Event Title */}
              <h3 className="text-xl lg:text-3xl font-title font-bold text-white mb-4 lg:mb-6">
                {currentEvent.title}
              </h3>

              {/* Date */}
              <div className="text-sm lg:text-base text-slate-300 mb-6 lg:mb-8">
                {formatDate(currentEvent.starts_at)}
              </div>

              {/* Game Name */}
              {currentEvent.gameName && (
                <div className="text-xs text-slate-400 uppercase tracking-wider">
                  {currentEvent.gameName}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                asChild
                size="sm"
                className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold text-xs lg:text-sm px-6 py-3"
              >
                <Link href={`/events/${currentEvent.id}`}>
                  View Event
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs lg:text-sm px-6 py-3"
              >
                <Link href="/events">
                  All Events
                </Link>
              </Button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5">
            {events.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToEvent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/40 hover:bg-white/60 w-2'
                }`}
                aria-label={`Go to event ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

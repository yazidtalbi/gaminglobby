'use client'

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { EventCard } from "./EventCard"
import { Event } from "@/types/database"

interface EventsCarouselProps {
  events: Array<{
    event: Event
    participantCount: number
    heroCoverUrl?: string | null
    squareIconUrl?: string | null
  }>
}

export function EventsCarousel({ events }: EventsCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  if (events.length === 0) {
    return null
  }

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      opts={{
        align: "start",
        loop: events.length > 1,
      }}
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {events.map(({ event, participantCount, heroCoverUrl, squareIconUrl }) => (
          <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-full">
            <EventCard
              event={event}
              heroCoverUrl={heroCoverUrl}
              squareIconUrl={squareIconUrl}
              participantCount={participantCount}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}

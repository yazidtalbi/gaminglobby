'use client'

import { useState, useEffect } from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { MostSearchedGameCardWrapper } from './MostSearchedGameCardWrapper'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MostSearchedCarouselProps {
  gameIds: string[]
  gamesData?: Array<{ gameId: string; name: string; logoUrl: string | null }>
}

export function MostSearchedCarousel({ gameIds, gamesData }: MostSearchedCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  useEffect(() => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    })
  }, [api])

  const scrollPrev = () => {
    api?.scrollPrev()
  }

  const scrollNext = () => {
    api?.scrollNext()
  }

  return (
    <div>
      {/* Header with title and chevrons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-title text-white">
          Most Searched This Week
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-8 w-8 rounded-full border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-8 w-8 rounded-full border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          slidesToScroll: 2,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {gameIds.map((gameId) => {
            const gameData = gamesData?.find(g => g.gameId === gameId)
            return (
              <CarouselItem key={gameId} className="pl-2 md:pl-4 basis-full md:basis-1/2">
                <MostSearchedGameCardWrapper 
                  gameId={gameId} 
                  name={gameData?.name || 'Unknown Game'}
                  logoUrl={gameData?.logoUrl || null}
                />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}


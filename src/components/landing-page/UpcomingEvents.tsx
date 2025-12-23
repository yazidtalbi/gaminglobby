import { UpcomingEventsClient } from './UpcomingEventsClient'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { getGameByIdOrSlug, getHeroImage, getGameLogo } from '@/lib/steamgriddb'
import { unstable_cache } from 'next/cache'

interface Event {
  id: string
  title: string
  game_id: string
  starts_at: string
  heroUrl?: string | null
  logoUrl?: string | null
  gameName?: string
}

async function getUpcomingEventsData(): Promise<Event[]> {
  const supabase = createPublicSupabaseClient()
  const now = new Date().toISOString()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['scheduled', 'ongoing'])
    .gte('ends_at', now)
    .order('starts_at', { ascending: true })
    .limit(6)

  if (!events || events.length === 0) return []

  // Fetch game data for each event
  const eventsWithGameData = await Promise.all(
    events.map(async (event) => {
      try {
        const gameData = await getGameByIdOrSlug(event.game_id)
        if (!gameData) return null

        const [heroImage, logoImage] = await Promise.all([
          getHeroImage(gameData.id),
          getGameLogo(gameData.id),
        ])

        return {
          id: event.id,
          title: event.title || event.name || gameData.name,
          game_id: event.game_id,
          starts_at: event.starts_at,
          heroUrl: heroImage?.url || null,
          logoUrl: logoImage?.url || null,
          gameName: gameData.name,
        } as Event
      } catch (error) {
        console.error(`Error fetching game data for event ${event.id}:`, error)
        return null
      }
    })
  )

  return eventsWithGameData.filter((event): event is Event => {
    return event !== null && event !== undefined
  })
}

const getUpcomingEvents = unstable_cache(
  getUpcomingEventsData,
  ['landing-upcoming-events'],
  { revalidate: 120 }
)

export async function UpcomingEvents() {
  const events = await getUpcomingEvents()

  if (events.length === 0) {
      return (
        <section className="relative z-10 py-12 lg:py-16 bg-slate-900/30">
          <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
            <h2 className="text-3xl lg:text-4xl font-title font-bold text-white mb-6 lg:mb-8 text-center">
              UPCOMING EVENTS
            </h2>
            <div className="text-center text-slate-400 text-sm">
              <p>No upcoming events at the moment</p>
            </div>
          </div>
        </section>
      )
  }

  return <UpcomingEventsClient events={events} />
}

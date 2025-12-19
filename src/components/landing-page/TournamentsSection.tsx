import { TournamentCard } from '@/components/TournamentCard'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'

const getTournaments = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
    
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select(`
        *,
        host:profiles!tournaments_host_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .in('status', ['open', 'registration_closed', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(6)

    return tournaments || []
  },
  ['landing-tournaments'],
  { revalidate: 120 }
)

export async function TournamentsSection() {
  const tournaments = await getTournaments()

  if (!tournaments || tournaments.length === 0) {
      return (
        <section className="relative z-10 py-12 lg:py-16">
          <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
            <h2 className="text-3xl lg:text-4xl font-title font-bold text-white mb-6 lg:mb-8 text-center">
              TOURNAMENTS
            </h2>
            <div className="text-center text-slate-400 text-sm">
              <p>No tournaments at the moment</p>
            </div>
          </div>
        </section>
      )
  }

      return (
        <section className="relative z-10 py-12 lg:py-16">
          <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h2 className="text-3xl lg:text-4xl font-title font-bold text-white">
            TOURNAMENTS
          </h2>
          <Link
            href="/tournaments"
            className="text-cyan-400 hover:text-cyan-300 font-medium text-xs uppercase tracking-wider"
          >
            View All →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {tournaments.slice(0, 2).map((tournament: any) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </div>
    </section>
  )
}

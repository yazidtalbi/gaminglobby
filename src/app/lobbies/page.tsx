import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { LobbyCard } from '@/components/LobbyCard'

export const metadata: Metadata = createMetadata({
  title: 'Live Gaming Lobbies - Join Active Lobbies',
  description: 'Browse active gaming lobbies, join live matches, and find players ready to play. View open lobbies across thousands of games and start matchmaking instantly on APOXER.COM.',
  path: '/lobbies',
})

const getActiveLobbies = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    const { data } = await supabase
      .from('lobbies')
      .select(`
        *,
        host:profiles!lobbies_host_id_fkey(username, avatar_url)
      `)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (!data || data.length === 0) return []

    // Get member counts
    const lobbyIds = data.map(l => l.id)
    const { data: memberCounts } = await supabase
      .from('lobby_members')
      .select('lobby_id')
      .in('lobby_id', lobbyIds)

    const counts: Record<string, number> = {}
    memberCounts?.forEach(m => {
      counts[m.lobby_id] = (counts[m.lobby_id] || 0) + 1
    })

    return data.map((lobby) => ({
      ...lobby,
      member_count: counts[lobby.id] || 1,
    }))
  },
  ['active-lobbies'],
  { revalidate: 60 } // Cache for 1 minute
)

export default async function LobbiesPage() {
  const lobbies = await getActiveLobbies()

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-title text-white mb-2">Live Lobbies</h1>
          <p className="text-slate-400">
            Browse active gaming lobbies and join players ready to play
          </p>
        </div>

        {/* Lobbies Grid */}
        {lobbies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-2">No active lobbies at the moment</p>
            <p className="text-sm text-slate-500">
              <Link href="/games" className="text-cyan-400 hover:text-cyan-300">
                Browse games
              </Link>{' '}
              to find or create a lobby
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lobbies.map((lobby) => (
              <LobbyCard key={lobby.id} lobby={lobby} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

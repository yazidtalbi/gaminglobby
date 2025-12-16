import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { People } from '@mui/icons-material'
import { Avatar } from '@/components/Avatar'

export const metadata: Metadata = createMetadata({
  title: 'Players Directory - Find Gaming Players',
  description: 'Browse the players directory, discover active gamers, view profiles, and connect with players who share your gaming interests. Find teammates and build your gaming network on APOXER.COM.',
  path: '/players',
})

const getActivePlayers = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()

    // Get players active in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, plan_tier, plan_expires_at, last_active_at')
      .gte('last_active_at', thirtyDaysAgo.toISOString())
      .order('last_active_at', { ascending: false })
      .limit(100)

    return data || []
  },
  ['active-players'],
  { revalidate: 300 } // Cache for 5 minutes
)

export default async function PlayersPage() {
  const players = await getActivePlayers()

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-title text-white mb-2 flex items-center gap-3">
            <People className="w-8 h-8 text-cyan-400" />
            Players Directory
          </h1>
          <p className="text-slate-400">
            Discover active players and connect with fellow gamers
          </p>
        </div>

        {/* Players Grid */}
        {players.length === 0 ? (
          <div className="text-center py-12">
            <People className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No active players found</p>
            <p className="text-sm text-slate-500">
              Check back soon to discover players
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/u/${player.username || player.id}`}
                className="group bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 rounded-xl p-4 text-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Avatar
                    src={player.avatar_url}
                    alt={player.username || 'Player'}
                    username={player.username}
                    size="lg"
                    showBorder
                    borderColor={
                      player.plan_tier === 'founder'
                        ? 'founder'
                        : player.plan_tier === 'pro' &&
                          (!player.plan_expires_at ||
                            new Date(player.plan_expires_at) > new Date())
                        ? 'pro'
                        : 'default'
                    }
                  />
                  <div className="w-full">
                    <p className="font-title text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                      {player.display_name || player.username}
                    </p>
                    {player.display_name && player.display_name !== player.username && (
                      <p className="text-xs text-slate-400 truncate">@{player.username}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

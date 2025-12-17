import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { getGameByIdOrSlug } from '@/lib/steamgriddb'
import { createMetadata } from '@/lib/seo/metadata'
import Link from 'next/link'
import { Gamepad2, Users, Plus, ArrowRight } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import { LobbyCard } from '@/components/LobbyCard'

const getGameLobbies = unstable_cache(
  async (gameId: number) => {
    const supabase = createPublicSupabaseClient()
    
    const { data: lobbies } = await supabase
      .from('lobbies')
      .select(`
        *,
        host:profiles!lobbies_host_id_fkey(username, avatar_url),
        lobby_members(count)
      `)
      .eq('game_id', gameId.toString())
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (!lobbies) return []
    
    return lobbies.map((lobby) => {
      const { lobby_members, host, ...rest } = lobby as {
        id: string;
        lobby_members: { count: number }[];
        host: { username: string; avatar_url: string | null } | null;
        [key: string]: unknown;
      };
      return {
        ...rest,
        id: rest.id,
        host: host || undefined,
        member_count: lobby_members?.[0]?.count || 1,
      };
    })
  },
  ['game-lobbies'],
  { revalidate: 60 } // Cache for 1 minute
)

const getGameStats = unstable_cache(
  async (gameId: number) => {
    const supabase = createPublicSupabaseClient()
    
    // Get active lobbies count
    const { count: activeLobbiesCount } = await supabase
      .from('lobbies')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId.toString())
      .in('status', ['open', 'in_progress'])
    
    // Get total players with this game
    const { count: totalPlayersCount } = await supabase
      .from('user_games')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId.toString())
    
    return {
      activeLobbies: activeLobbiesCount || 0,
      totalPlayers: totalPlayersCount || 0,
    }
  },
  ['game-stats'],
  { revalidate: 300 } // Cache for 5 minutes
)

interface PageProps {
  params: Promise<{ gameId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameId } = await params
  
  const game = await getGameByIdOrSlug(gameId)
  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }
  
  const stats = await getGameStats(game.id)
  
  return {
    ...createMetadata({
      title: `Find Players for ${game.name} - Matchmaking & Lobbies`,
      description: `Find players for ${game.name}. Browse ${stats.activeLobbies} active lobbies, create your own lobby, and connect with ${stats.totalPlayers} players on APOXER.`,
      path: `/games/${gameId}/find-players`,
    }),
    openGraph: {
      title: `Find Players for ${game.name}`,
      description: `${stats.activeLobbies} active lobbies • ${stats.totalPlayers} players`,
    },
  }
}

export default async function FindPlayersPage({ params }: PageProps) {
  const { gameId } = await params
  
  const game = await getGameByIdOrSlug(gameId)
  if (!game) {
    notFound()
  }
  
  if (!game) {
    notFound()
  }

  const [lobbies, stats] = await Promise.all([
    getGameLobbies(game.id),
    getGameStats(game.id),
  ])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/games/${gameId}`}
            className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-flex items-center gap-1"
          >
            ← Back to {game.name}
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mt-4">
            {game.coverThumb && (
              <div className="relative w-24 h-36 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={game.coverThumb}
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Find Players for {game.name}
              </h1>
              <p className="text-slate-300">
                Browse active lobbies or create your own to find teammates
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase">Active Lobbies</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeLobbies}</p>
            <p className="text-sm text-slate-400 mt-1">Open now</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase">Total Players</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalPlayers}</p>
            <p className="text-sm text-slate-400 mt-1">On APOXER</p>
          </div>
        </div>
        
        {/* Create Lobby CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Can't find the right lobby?</h3>
              <p className="text-slate-300">Create your own lobby and invite players</p>
            </div>
            <Link
              href={`/games/${gameId}?action=create-lobby`}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create Lobby
            </Link>
          </div>
        </div>
        
        {/* Lobbies List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Active Lobbies ({lobbies.length})
          </h2>
          
          {lobbies.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700 text-center">
              <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Active Lobbies</h3>
              <p className="text-slate-400 mb-6">
                Be the first to create a lobby for {game.name}
              </p>
              <Link
                href={`/games/${gameId}?action=create-lobby`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Lobby
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lobbies.map((lobby) => (
                <LobbyCard
                  key={lobby.id}
                  lobby={lobby as any}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

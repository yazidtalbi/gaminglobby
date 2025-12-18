import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { getGameByIdOrSlug, getHeroImage } from '@/lib/steamgriddb'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/slug'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Monitor, Gamepad, Clock, ArrowRight, Plus, CheckCircle2, Zap, Globe } from 'lucide-react'
import { Lobby } from '@/types/database'

export const revalidate = 120 // ISR: revalidate every 2 minutes

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getGameBySlug(slug: string) {
  const game = await getGameByIdOrSlug(slug)
  if (!game) return null

  // Fetch hero image for display
  const heroImage = await getHeroImage(game.id)
  const heroUrl = heroImage?.url || game.coverUrl || null
  const heroThumb = heroImage?.thumb || game.coverThumb || null

  return {
    ...game,
    heroUrl,
    heroThumb,
  }
}

async function getActiveLobbiesByGameId(gameId: number) {
  const supabase = createPublicSupabaseClient()

  const { data: lobbiesData, error } = await supabase
    .from('lobbies')
    .select(`
      *,
      host:profiles!lobbies_host_id_fkey(username, avatar_url),
      lobby_members(count)
    `)
    .eq('game_id', gameId.toString())
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching lobbies:', error)
    return []
  }

  if (!lobbiesData) return []

  return lobbiesData.map((lobby) => {
    const { lobby_members, host, ...rest } = lobby as {
      lobby_members: { count: number }[];
      host: { username: string; avatar_url: string | null } | null;
      [key: string]: unknown;
    };
    return {
      ...rest,
      host: host || undefined,
      member_count: lobby_members?.[0]?.count || 1,
    } as Lobby & {
      host?: {
        username: string;
        avatar_url: string | null;
      };
      member_count?: number;
    };
  })
}

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatTimeUntilExpiry(createdAt: string, lastActiveAt: string): string | null {
  // Lobbies typically expire after 1 hour of host inactivity
  const lastActive = new Date(lastActiveAt).getTime()
  const expiresAt = lastActive + (60 * 60 * 1000) // 1 hour
  const now = Date.now()
  const msUntilExpiry = expiresAt - now

  if (msUntilExpiry <= 0) return null

  const minutes = Math.floor(msUntilExpiry / (60 * 1000))
  if (minutes < 60) return `Ends in ${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  return `Ends in ${hours}h`
}

const platformLabels: Record<string, string> = {
  pc: 'PC',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Mobile',
  other: 'Other',
}

const platformIcons: Record<string, React.ReactNode> = {
  pc: <Monitor className="w-4 h-4" />,
  ps: <Gamepad className="w-4 h-4" />,
  xbox: <Gamepad className="w-4 h-4" />,
  switch: <Gamepad className="w-4 h-4" />,
  mobile: <Gamepad className="w-4 h-4" />,
  other: <Gamepad className="w-4 h-4" />,
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return createMetadata({
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
      path: `/find-players/${slug}`,
      noIndex: true,
    })
  }

  const title = `Find ${game.name} Players`
  const description = `Find people to play ${game.name} with right now. Join active lobbies or create one in seconds on Apoxer.`

  return createMetadata({
    title,
    description,
    path: `/find-players/${slug}`,
    images: game.heroUrl || game.coverUrl ? [game.heroUrl || game.coverUrl || ''] : [],
  })
}

function generateJsonLd(game: Awaited<ReturnType<typeof getGameBySlug>>) {
  const gameSlug = generateSlug(game!.name)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Find ${game!.name} Players`,
    description: `Find people to play ${game!.name} with right now. Join active lobbies or create one in seconds on Apoxer.`,
    url: `https://www.apoxer.com/find-players/${gameSlug}`,
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `How do I find ${game!.name} players?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Browse active lobbies on this page, or create your own lobby. All lobbies are short-lived and organized by game, so you'll connect with players who are ready to play ${game!.name} right now.`,
          },
        },
        {
          '@type': 'Question',
          name: 'Are these real players and lobbies?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. All lobbies on Apoxer are created by real players. We don\'t use fake data or artificial social proof. Every lobby shows real player counts and creation times.',
          },
        },
      ],
    },
  }
}

export default async function FindPlayersPage({ params }: PageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    notFound()
  }

  const [lobbies] = await Promise.all([
    getActiveLobbiesByGameId(game.id),
  ])

  const gameSlug = generateSlug(game.name)
  const jsonLd = generateJsonLd(game)

  return (
    <>
      <JsonLd data={jsonLd} />
      
      <div className="min-h-screen bg-slate-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              {/* Left: Text Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-title font-bold text-white mb-4 lg:text-5xl">
                  Find {game.name} Players
                </h1>
                <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0">
                  See who&apos;s online right now, join a lobby, or create one in seconds.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-title font-semibold"
                  >
                    <a href="#active-lobbies">
                      View active lobbies
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800 font-title"
                  >
                    <Link href={`/games/${gameSlug}`}>
                      <Plus className="mr-2 w-5 h-5" />
                      Create a lobby
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right: Game Image */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-800">
                {(game.heroUrl || game.coverUrl) ? (
                  <Image
                    src={game.heroUrl || game.coverUrl || ''}
                    alt={game.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-800">
                    <Gamepad className="w-16 h-16 text-slate-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Active Lobbies Section */}
        <section id="active-lobbies" className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-title font-bold text-white mb-8">Active Lobbies</h2>

            {lobbies.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lobbies.map((lobby) => {
                  const timeUntilExpiry = formatTimeUntilExpiry(lobby.created_at, lobby.host_last_active_at)
                  const playerCount = lobby.member_count || 1
                  const maxPlayers = lobby.max_players || 8

                  return (
                    <Card key={lobby.id} className="hover:border-cyan-500/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg line-clamp-2">{lobby.title}</CardTitle>
                          <Badge
                            variant={lobby.status === 'open' ? 'success' : 'warning'}
                            className="ml-2 shrink-0"
                          >
                            {lobby.status === 'open' ? 'Open' : 'In Progress'}
                          </Badge>
                        </div>
                        {lobby.description && (
                          <p className="text-sm text-slate-400 line-clamp-2">{lobby.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Platform & Player Count */}
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                              {platformIcons[lobby.platform]}
                              <span>{platformLabels[lobby.platform]}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span>
                                {playerCount} / {maxPlayers} players
                              </span>
                            </div>
                          </div>

                          {/* Time Info */}
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>Created {formatTimeAgo(lobby.created_at)}</span>
                            </div>
                            {timeUntilExpiry && (
                              <span className="text-amber-400">{timeUntilExpiry}</span>
                            )}
                          </div>

                          {/* Host Info */}
                          {lobby.host && (
                            <div className="text-sm text-slate-400">
                              Host: <span className="text-slate-300">{lobby.host.username}</span>
                            </div>
                          )}

                          {/* CTA */}
                          <Button
                            asChild
                            className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-title font-semibold"
                          >
                            <Link href={`/lobbies/${lobby.id}`}>
                              Join lobby
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-title font-semibold text-white mb-2">
                    No active lobbies right now.
                  </h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    Create the first lobby — players searching for {game.name} will find it here.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-title font-semibold"
                  >
                    <Link href={`/games/${gameSlug}`}>
                      <Plus className="mr-2 w-5 h-5" />
                      Create a lobby
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Why Apoxer Works */}
        <section className="py-12 lg:py-16 border-t border-slate-800 bg-slate-950/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-title font-bold text-white mb-8 text-center">
              Why Apoxer Works
            </h2>
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 mb-4">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-title font-semibold text-white mb-2">
                  Short-lived lobbies = real intent
                </h3>
                <p className="text-sm text-slate-400">
                  Lobbies expire after inactivity, so you only see players who are ready to play right now.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 mb-4">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-title font-semibold text-white mb-2">
                  No Discord hunting
                </h3>
                <p className="text-sm text-slate-400">
                  Find players directly on Apoxer. No need to join servers or send friend requests.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-title font-semibold text-white mb-2">
                  Communities organized per game
                </h3>
                <p className="text-sm text-slate-400">
                  Everything is organized by game, so you connect with the right players instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Internal Linking Section */}
        <section className="py-12 lg:py-16 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="text-slate-500">Related:</span>
              <Link
                href={`/is-${gameSlug}-still-active`}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Is {game.name} still active?
              </Link>
              <span className="text-slate-600">•</span>
              <Link
                href={`/games/${gameSlug}`}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                {game.name} hub
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

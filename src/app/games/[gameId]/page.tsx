import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createMetadata, absoluteUrl } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateVideoGameJsonLd } from '@/lib/seo/jsonld'
import { getGameByIdOrSlug, getHeroImage } from '@/lib/steamgriddb'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { GameDetailClient } from './GameDetailClient'
import { generateSlug } from '@/lib/slug'

interface PageProps {
  params: Promise<{ gameId: string }>
}

async function getGameData(gameIdOrSlug: string) {
  const game = await getGameByIdOrSlug(gameIdOrSlug)
  
  if (!game) return null

  // Fetch hero image from heroes endpoint for background banner
  const heroImage = await getHeroImage(game.id)
  const heroUrl = heroImage?.url || null
  const heroThumb = heroImage?.thumb || null

  // Fetch selected cover
        let selectedCoverUrl: string | null = null
        let selectedCoverThumb: string | null = null
          try {
    const supabase = createPublicSupabaseClient()
    const { data: selectedCover } = await supabase
      .from('game_selected_covers')
      .select('selected_cover_url, selected_cover_thumb')
      .eq('game_id', game.id.toString())
      .single()

    if (selectedCover && selectedCover.selected_cover_url) {
      selectedCoverUrl = selectedCover.selected_cover_url
      selectedCoverThumb = selectedCover.selected_cover_thumb
    }
  } catch (error) {
    // Silently fail
  }

  return {
    ...game,
    heroUrl,
    heroThumb,
    coverUrl: selectedCoverUrl || game.coverUrl || null,
    coverThumb: selectedCoverThumb || game.coverThumb || null,
  }
}

async function getGameStats(gameId: string) {
  const supabase = createPublicSupabaseClient()
  
  const [playersResult, searchesResult, lobbiesResult] = await Promise.all([
    supabase
      .from('user_games')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId),
    supabase
      .from('game_search_events')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('lobbies')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .in('status', ['open', 'in_progress']),
  ])

          return {
    playersCount: playersResult.count || 0,
    searchCount: searchesResult.count || 0,
    lobbiesCount: lobbiesResult.count || 0,
  }
}

// Helper function to build SEO-optimized game title
function buildGameTitle(gameName: string): string {
  return `${gameName} Multiplayer`
}

// Helper function to build SEO-optimized game description
function buildGameDescription(gameName: string, stats: { playersCount: number; lobbiesCount: number; searchCount: number }): string {
  const hasLobbies = stats.lobbiesCount > 0
  const hasPlayers = stats.playersCount > 0
  
  if (hasLobbies && hasPlayers) {
    return `Find active ${gameName} multiplayer lobbies and players on Apoxer. ${stats.playersCount.toLocaleString()} players, ${stats.lobbiesCount} active lobbies. Join matches or create your own lobby to start playing ${gameName} today.`
  } else if (hasPlayers) {
    return `Find players for ${gameName} multiplayer on Apoxer. ${stats.playersCount.toLocaleString()} players looking for matches. Create a lobby to start matchmaking and connect with the ${gameName} community.`
  } else {
    return `Find players and create lobbies for ${gameName} multiplayer on Apoxer. Join the community, discover active matches, and start playing ${gameName} with other players today.`
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameId } = await params
  const game = await getGameData(gameId)

  if (!game) {
    return createMetadata({
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
      path: `/games/${gameId}`,
      noIndex: true,
    })
  }

  const stats = await getGameStats(game.id.toString())
  const gameSlug = generateSlug(game.name)
  const canonicalPath = `/games/${gameSlug}`
  const title = buildGameTitle(game.name)
  const description = buildGameDescription(game.name, stats)

  const images = game.coverUrl || game.heroUrl ? [game.coverUrl || game.heroUrl || ''] : []

  return {
    ...createMetadata({
      title,
      description,
      path: canonicalPath,
      images,
    }),
    openGraph: {
      ...createMetadata({
        title,
        description,
        path: canonicalPath,
        images,
      }).openGraph,
      type: 'website',
    },
    twitter: {
      ...createMetadata({
        title,
        description,
        path: canonicalPath,
        images,
      }).twitter,
      card: 'summary_large_image',
    },
  }
}

export default async function GameDetailPage({ params }: PageProps) {
  const { gameId } = await params
  const game = await getGameData(gameId)

  if (!game) {
    const stats = await getGameStats(gameId)
    // Still render the page with client-side fetching
  }

  const stats = game ? await getGameStats(game.id.toString()) : { playersCount: 0, searchCount: 0, lobbiesCount: 0 }

  // Generate canonical URL using slug
  const gameSlug = game ? generateSlug(game.name) : gameId
  const canonicalUrl = absoluteUrl(`/games/${gameSlug}`)

  // Generate structured data
  const videoGameJsonLd = game
    ? generateVideoGameJsonLd(
        game.name,
        canonicalUrl,
        game.coverUrl || game.heroUrl || undefined,
        {
          description: buildGameDescription(game.name, stats),
          gamePlatform: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
        }
      )
    : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Games',
        item: absoluteUrl('/games'),
      },
      ...(game
        ? [
      {
        '@type': 'ListItem',
        position: 3,
        name: game.name,
        item: canonicalUrl,
      },
          ]
        : []),
    ],
  }

  const faqJsonLd = game
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Is ${game.name} still active?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes, ${game.name} is still active on Apoxer! You can find active lobbies and players looking for teammates. Create a lobby to start matchmaking.`,
            },
          },
          {
            '@type': 'Question',
            name: `How do I find players for ${game.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `You can find players for ${game.name} by browsing active lobbies, using the "Find Players" feature, or creating your own lobby. Join the ${game.name} community on Apoxer to connect with thousands of players.`,
            },
          },
          {
            '@type': 'Question',
            name: `How do I create a lobby for ${game.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Click the "Create Lobby" button on the ${game.name} page, select your platform, set the number of players, and invite friends or wait for others to join. You can also use Quick Matchmaking to instantly find or create a lobby.`,
            },
          },
          {
            '@type': 'Question',
            name: `What platforms are supported for ${game.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Apoxer supports all major gaming platforms including PC, PlayStation, Xbox, Nintendo Switch, and Mobile. You can filter lobbies by platform to find players on your preferred system.`,
            },
          },
          {
            '@type': 'Question',
            name: 'Is Apoxer free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, Apoxer is completely free to use. You can browse lobbies, create lobbies, and find players at no cost.',
            },
          },
        ],
      }
    : null

  return (
    <>
      {/* Structured Data */}
      {videoGameJsonLd && <JsonLd data={videoGameJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      {/* Client Component */}
      <GameDetailClient gameIdOrSlug={gameId} initialGame={game} />
    </>
  )
}

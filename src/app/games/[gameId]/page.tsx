import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createMetadata, absoluteUrl } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateVideoGameJsonLd } from '@/lib/seo/jsonld'
import { getGameById, getHorizontalCover } from '@/lib/steamgriddb'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { GameDetailClient } from './GameDetailClient'

interface PageProps {
  params: Promise<{ gameId: string }>
}

async function getGameData(gameIdOrSlug: string) {
        const isNumeric = /^\d+$/.test(gameIdOrSlug)
        
  let game
        if (isNumeric) {
    game = await getGameById(parseInt(gameIdOrSlug, 10))
        } else {
    // For slugs, we'd need to search first, but for now fallback to client-side fetch
    return null
  }

  if (!game) return null

  // Fetch hero image (horizontal cover)
  const horizontalCover = await getHorizontalCover(game.id)
  const heroUrl = horizontalCover?.url || null
  const heroThumb = horizontalCover?.thumb || null

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
  const description = `Find players, join lobbies, and connect with the ${game.name} community on Apoxer. ${stats.playersCount.toLocaleString()} players, ${stats.lobbiesCount} active lobbies. Create or join a lobby to start playing ${game.name} today!`

  const images = game.coverUrl || game.heroUrl ? [game.coverUrl || game.heroUrl || ''] : []

  return {
    ...createMetadata({
      title: `${game.name} - Find Players & Join Lobbies`,
      description,
      path: `/games/${gameId}`,
      images,
    }),
    openGraph: {
      ...createMetadata({
        title: `${game.name} - Find Players & Join Lobbies`,
        description,
        path: `/games/${gameId}`,
        images,
      }).openGraph,
      type: 'website',
    },
    twitter: {
      ...createMetadata({
        title: `${game.name} - Find Players & Join Lobbies`,
        description,
        path: `/games/${gameId}`,
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

  // Generate structured data
  const videoGameJsonLd = game
    ? generateVideoGameJsonLd(
        game.name,
        absoluteUrl(`/games/${gameId}`),
        game.coverUrl || game.heroUrl || undefined,
        {
          description: `Find players, join lobbies, and connect with the ${game.name} community on Apoxer. ${stats.playersCount.toLocaleString()} active players and ${stats.lobbiesCount} lobbies available.`,
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
              item: absoluteUrl(`/games/${gameId}`),
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

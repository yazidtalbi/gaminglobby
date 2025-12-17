import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/lib/supabase/server'
import { getGameById, searchGames } from '@/lib/steamgriddb'
import { createMetadata } from '@/lib/seo/metadata'
import Link from 'next/link'
import { Gamepad2, Users, Clock, ArrowRight, ExternalLink, Zap, Search, MessageSquare, Globe, Shield, TrendingUp, CheckCircle2 } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'

// Fetch hero image for a game
async function getGameHero(gameId: number): Promise<{ url: string | null; thumb: string | null }> {
  try {
    const STEAMGRIDDB_API_BASE = process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'
    const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY || ''
    
    if (!STEAMGRIDDB_API_KEY) {
      return { url: null, thumb: null }
    }
    
    const response = await fetch(
      `${STEAMGRIDDB_API_BASE}/heroes/game/${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )
    
    if (!response.ok) {
      return { url: null, thumb: null }
    }
    
    const data = await response.json()
    const heroes = (data.data || []) as Array<{ url: string; thumb: string; nsfw: boolean; epilepsy: boolean }>
    
    // Filter out NSFW and epilepsy content, get first hero
    const filteredHeroes = heroes.filter((hero) => !hero.nsfw && !hero.epilepsy)
    
    if (filteredHeroes.length > 0) {
      return {
        url: filteredHeroes[0].url || null,
        thumb: filteredHeroes[0].thumb || null,
      }
    }
    
    return { url: null, thumb: null }
  } catch (error) {
    console.error('Hero fetch error:', error)
    return { url: null, thumb: null }
  }
}

// Convert game slug to game ID
// Handles formats like: "730", "730-still-active", "huntdown", "huntdown-still-active"
async function getGameIdFromSlug(slug: string[]): Promise<number | null> {
  // Join the slug array and remove "-still-active" or "-dead" suffix
  // Handle cases where it might be duplicated
  let fullSlug = slug.join('-')
  // Remove all occurrences of -still-active or -dead at the end
  while (fullSlug.endsWith('-still-active') || fullSlug.endsWith('-dead')) {
    fullSlug = fullSlug.replace(/-still-active$/, '').replace(/-dead$/, '')
  }
  const cleanSlug = fullSlug
  
  // Try to parse as number first (backward compatibility)
  const numericId = parseInt(cleanSlug, 10)
  if (!isNaN(numericId)) {
    return numericId
  }
  
  // If not numeric, search for game by name
  // Try multiple search strategies for better matching
  const searchQueries = [
    // Original slug with spaces and capitalization
    cleanSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    // Just the slug with spaces
    cleanSlug.replace(/-/g, ' '),
    // Original slug (in case it's already a valid name)
    cleanSlug,
  ]
  
  // Try each search query
  for (const query of searchQueries) {
    const searchResults = await searchGames(query)
    
    if (searchResults.length === 0) continue
    
    // Try exact match first (case-insensitive, ignoring special chars)
    const normalizedSlug = cleanSlug.replace(/-/g, ' ').toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const exactMatch = searchResults.find(game => {
      const normalizedName = game.name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      return normalizedName === normalizedSlug
    })
    
    if (exactMatch) {
      return exactMatch.id
    }
    
    // Try partial match (slug is contained in game name)
    const partialMatch = searchResults.find(game => {
      const normalizedName = game.name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      return normalizedName.includes(normalizedSlug) || normalizedSlug.includes(normalizedName.split(' ')[0])
    })
    
    if (partialMatch) {
      return partialMatch.id
    }
    
    // Fallback to first result if we have matches
    if (searchResults.length > 0) {
      return searchResults[0].id
    }
  }
  
  return null
}

const getGameActivity = unstable_cache(
  async (gameId: number) => {
    const supabase = createPublicSupabaseClient()
    
    // Get active lobbies count
    const { count: activeLobbiesCount } = await supabase
      .from('lobbies')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId.toString())
      .in('status', ['open', 'in_progress'])
    
    // Get recent lobbies (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentLobbies } = await supabase
      .from('lobbies')
      .select('id, created_at, title, status')
      .eq('game_id', gameId.toString())
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get total players looking (users with this game in library who are active)
    const sevenDaysAgo2 = new Date()
    sevenDaysAgo2.setDate(sevenDaysAgo2.getDate() - 7)
    
    const { data: activePlayers } = await supabase
      .from('user_games')
      .select('user_id')
      .eq('game_id', gameId.toString())
    
    const userIds = activePlayers?.map(p => p.user_id) || []
    
    const { count: activePlayersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('id', userIds)
      .gte('last_active_at', sevenDaysAgo2.toISOString())
    
    // Get last lobby created time
    const { data: lastLobby } = await supabase
      .from('lobbies')
      .select('created_at')
      .eq('game_id', gameId.toString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return {
      activeLobbies: activeLobbiesCount || 0,
      recentLobbies: recentLobbies || [],
      activePlayers: activePlayersCount || 0,
      lastLobbyCreated: lastLobby?.created_at || null,
    }
  },
  ['game-activity'],
  { revalidate: 300 } // Cache for 5 minutes
)

function TimeAgo({ dateString }: { dateString: string }) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return <span>Just now</span>
  if (seconds < 3600) return <span>{Math.floor(seconds / 60)} minutes ago</span>
  if (seconds < 86400) return <span>{Math.floor(seconds / 3600)} hours ago</span>
  if (seconds < 604800) return <span>{Math.floor(seconds / 86400)} days ago</span>
  return <span>{Math.floor(seconds / 604800)} weeks ago</span>
}

// Internal Presentational Components
function Section({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="py-20">
      {title && (
        <div className="mb-12">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-slate-300">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

function StatCard({ icon: Icon, label, value, helper }: { icon: React.ElementType; label: string; value: React.ReactNode; helper?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-cyan-400" />
        <span className="text-slate-400 text-sm uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-4xl font-bold text-white mb-1">{value}</div>
      {helper && <p className="text-slate-400 text-sm">{helper}</p>}
    </div>
  )
}

function FeatureCard({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <h3 className="text-xl font-title font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 leading-relaxed">{desc}</p>
    </div>
  )
}

function Step({ n, title, desc, href }: { n: number; title: string; desc: string; href?: string }) {
  const numberStr = n.toString().padStart(2, '0')
  const content = (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full">
      <div className="text-5xl font-title font-bold text-white mb-4">{numberStr}.</div>
      <h3 className="text-xl font-title font-semibold text-white mb-3 leading-tight">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
    </div>
  )
  
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }
  
  return content
}

function ReasonItem({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <div>
        <h3 className="text-lg font-title font-semibold text-white mb-1">{title}</h3>
        <p className="text-slate-300 text-sm">{desc}</p>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="border-b border-slate-700/50 py-4">
      <summary className="cursor-pointer text-lg font-title font-semibold text-white hover:text-cyan-400 transition-colors">
        {q}
      </summary>
      <p className="mt-3 text-slate-300 leading-relaxed pl-4">{a}</p>
    </details>
  )
}

interface PageProps {
  params: Promise<{ gameSlug: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameSlug } = await params
  const gameId = await getGameIdFromSlug(gameSlug)
  
  if (!gameId) {
    return {
      title: 'Game Not Found',
    }
  }
  
  const game = await getGameById(gameId)
  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }
  
  const activity = await getGameActivity(gameId)
  const gameName = game.name
  const isActive = activity.activeLobbies > 0 || activity.activePlayers > 0
  const currentYear = new Date().getFullYear()
  
  // Get horizontal cover for OG image
  const horizontalCover = game.horizontalCoverUrl || game.horizontalCoverThumb || null
  const ogImages = horizontalCover ? [horizontalCover] : undefined
  
  // Generate the public-facing URL (without /is/ prefix, using /is- format)
  // Remove any existing -still-active suffix, then add it back
  let slugPart = gameSlug.join('-')
  slugPart = slugPart.replace(/-still-active$/, '').replace(/-dead$/, '')
  const publicUrl = `/is-${slugPart}-still-active`
  
  return {
    ...createMetadata({
      title: `Is ${gameName} Still Active in ${currentYear}? Find Players Here`,
      description: `${gameName} is still active on APOXER. Find players and join lobbies now.`,
      path: publicUrl,
      images: ogImages,
    }),
    openGraph: {
      title: `Is ${gameName} Still Active?`,
      description: `${gameName} is still active on APOXER. Find players and join lobbies now.`,
      images: ogImages ? ogImages.map(img => ({ url: img })) : undefined,
    },
  }
}

export default async function IsGameAlivePage({ params }: PageProps) {
  const { gameSlug } = await params
  const gameId = await getGameIdFromSlug(gameSlug)
  
  if (!gameId) {
    notFound()
  }
  
  const game = await getGameById(gameId)
  if (!game) {
    notFound()
  }
  
  const activity = await getGameActivity(gameId)
  const isActive = activity.activeLobbies > 0 || activity.activePlayers > 0
  const currentYear = new Date().getFullYear()
  
  // Fetch hero image (like game page does)
  const hero = await getGameHero(gameId)
  const ctaHeroImage = hero.url || hero.thumb || null
  
  // Generate FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${game.name} still active?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: isActive
            ? `Yes, ${game.name} is still active with ${activity.activeLobbies} active lobbies and ${activity.activePlayers} players looking for teammates.`
            : `${game.name} has some player activity. You can find players and create lobbies on APOXER.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I find players for ${game.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can find players for ${game.name} on APOXER by browsing active lobbies or creating your own lobby. Join the community to connect with other players.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Is APOXER a Discord replacement?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, APOXER is a discovery layer. We help you find active lobbies and players, then you coordinate and play elsewhere. We complement Discord, not replace it.',
        },
      },
      {
        '@type': 'Question',
        name: `What if there are no lobbies for ${game.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `If there are no active lobbies, you can create the first one. APOXER works best when players create lobbies - be the first to start matchmaking for ${game.name}.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Is APOXER free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, APOXER is free to use. You can browse lobbies, create lobbies, and find players at no cost.',
        },
      },
    ],
  }
  
  // Generate the public-facing URL (without /is/ prefix, using /is- format)
  // Remove any existing -still-active suffix, then add it back
  let slugPart = gameSlug.join('-')
  slugPart = slugPart.replace(/-still-active$/, '').replace(/-dead$/, '')
  const publicUrl = `/is-${slugPart}-still-active`
  
  // Generate BreadcrumbList schema for better SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://apoxer.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: game.name,
        item: `https://apoxer.com/games/${gameId}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Is ${game.name} Still Active?`,
        item: `https://apoxer.com${publicUrl}`,
      },
    ],
  }
  
  // Generate WebPage schema
  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Is ${game.name} Still Active in ${currentYear}?`,
    description: `${game.name} is still active on APOXER. Find players and join lobbies now.`,
    url: `https://apoxer.com${publicUrl}`,
    breadcrumb: breadcrumbSchema,
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />
      
      <div className="min-h-screen bg-slate-900">
        {/* Top Horizontal Line */}
        <div className="border-t border-slate-700/50"></div>
        
        {/* 1. HERO SECTION */}
        <div className="flex flex-col lg:flex-row border-b border-slate-700/50">
          {/* Left Column - Content */}
          <div className="flex-1 px-8 lg:px-16 xl:px-24 py-12 bg-slate-900 flex flex-col justify-center">
            <h1 className="text-5xl lg:text-6xl font-title font-bold text-white mb-6 leading-tight">
              Is {game.name} still active in {currentYear}?
            </h1>
            
            {/* Answer Line */}
            {isActive && (
              <div className="mb-6">
                <p className="text-3xl lg:text-4xl font-title font-bold text-cyan-400">
                  Yes — {game.name} is still active.
                </p>
              </div>
            )}
            
            {/* Supporting Paragraph */}
            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
              {game.name} is still active on Apoxer. Create and join active lobbies, events and tournaments.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/games/${gameId}`}
                className="px-6 py-3 bg-cyan-400 text-slate-900 font-title font-medium rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Find players
              </Link>
            </div>
          </div>
          
          {/* Vertical Separator */}
          <div className="hidden lg:block w-px bg-slate-700/50"></div>
          
          {/* Right Column - Image */}
          <div 
            className="flex-1 px-8 lg:px-16 xl:px-24 py-12 relative overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(0deg, #2F3B52 0%, #162032 70%, #162032 100%)'
            }}
          >
            {game.coverThumb && (
              <div className="relative w-full max-w-xs aspect-[3/4] rounded-lg overflow-hidden">
                <Image
                  src={game.coverThumb}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Separator */}
        <div className="border-t border-slate-700/50"></div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 bg-slate-900">
          {/* 2. WHAT IS APOXER */}
          <Section
            title="What is APOXER?"
          >
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Left Column - Content */}
              <div>
                <p className="text-lg text-slate-300 leading-relaxed">
                  APOXER is a gaming matchmaking platform designed for both game players and gaming communities. Whether you're looking for teammates, want to discover new games, or need to find active players for your favorite titles, APOXER connects you with thousands of gamers worldwide.
                </p>
              </div>
              
              {/* Right Column - Content */}
              <div className="space-y-4">
                <p className="text-lg text-slate-300 leading-relaxed">
                  Browse active game lobbies, create your own matchmaking sessions, and join communities of players who share your passion. APOXER makes it easy to find players, organize games, and stay connected with the gaming community.
                </p>
                <div className="pt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Explore APOXER <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Section>
          
          <div className="border-t border-slate-700/50"></div>
          
          {/* 3. PROCESS STEPS */}
          <Section
            title="How APOXER helps you find players"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Step
                n={1}
                title={`Go to ${game.name} page`}
                desc="Browse the game page and see current activity"
                href={`/games/${gameId}`}
              />
              <Step
                n={2}
                title="Join a lobby (or create one)"
                desc="Connect with players who are ready now"
              />
              <Step
                n={3}
                title="Coordinate quickly"
                desc="Use lobby chat to organize and get started"
              />
              <Step
                n={4}
                title="Play"
                desc="Jump into the game with your new teammates"
              />
            </div>
          </Section>
          
          <div className="border-t border-slate-700/50"></div>
          
          {/* 4. VALUE SECTION */}
          <Section
            title="Find teammates without hunting dead links"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={Zap}
                title="Live presence"
                desc="See real-time activity. No more guessing if a game is dead or if players are actually online and looking."
              />
              <FeatureCard
                icon={Clock}
                title="Short-lived lobbies"
                desc="Lobbies close after inactivity, so you only see intent-based matchmaking. No expired invites or dead channels."
              />
              <FeatureCard
                icon={Globe}
                title="Community discovery"
                desc="Find active players, browse recent lobbies, and discover community resources all in one place."
              />
            </div>
          </Section>
          
          <div className="border-t border-slate-700/50"></div>
          
          {/* 5. REASONS */}
          <Section
            title={`6 reasons players use APOXER for ${game.name}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ReasonItem
                icon={Zap}
                title="Real-time activity"
                desc="See who's actually online and looking, not just who owns the game."
              />
              <ReasonItem
                icon={Search}
                title="No dead links"
                desc="Lobbies auto-close when inactive, so you only see active matchmaking."
              />
              <ReasonItem
                icon={MessageSquare}
                title="Quick coordination"
                desc="Built-in chat helps you organize and get into games faster."
              />
              <ReasonItem
                icon={Globe}
                title="Game-specific discovery"
                desc="Each game has its own activity page, making it easy to find players."
              />
              <ReasonItem
                icon={Shield}
                title="Not a Discord replacement"
                desc="We help you discover, then you play elsewhere. Simple and focused."
              />
              <ReasonItem
                icon={TrendingUp}
                title="Growing community"
                desc="Join thousands of players finding teammates across hundreds of games."
              />
            </div>
          </Section>
          
          <div className="border-t border-slate-700/50"></div>
          
          {/* 6. RECENT LOBBIES */}
          {activity.recentLobbies.length > 0 && (
            <>
              <Section
                title={`Recent ${game.name} activity`}
                subtitle="Created in the last 7 days."
              >
                <div className="space-y-4">
                  {activity.recentLobbies.slice(0, 5).map((lobby) => (
                    <Link
                      key={lobby.id}
                      href={`/lobbies/${lobby.id}`}
                      className="block p-6 border border-slate-700/50 rounded-lg hover:border-slate-600 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-title font-semibold text-white">
                              {lobby.title || 'Untitled Lobby'}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              lobby.status === 'open' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {lobby.status === 'open' ? 'Open' : 'In Progress'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">
                            Created <TimeAgo dateString={lobby.created_at} />
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
              
              <div className="border-t border-slate-700/50"></div>
            </>
          )}
          
          {/* 8. COMMUNITY RESOURCES */}
          <Section
            title="Community resources"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-title font-semibold text-white mb-2">Community hubs</h3>
                <p className="text-slate-400 text-sm mb-4">Coming soon</p>
                <p className="text-slate-500 text-xs">We're working on integrating Discord servers, subreddits, and other community resources.</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-title font-semibold text-white mb-2">Browse all lobbies</h3>
                <p className="text-slate-300 text-sm mb-4">See all active lobbies for {game.name}</p>
                <Link
                  href={`/games/${gameId}`}
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Browse lobbies <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-title font-semibold text-white mb-2">Create a lobby</h3>
                <p className="text-slate-300 text-sm mb-4">Start your own matchmaking session</p>
                <Link
                  href={`/games/${gameId}?action=create-lobby`}
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Create lobby <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Section>
          
          <div className="border-t border-slate-700/50"></div>
          
          {/* 8. FAQ */}
          <Section
            title="FAQ"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <FAQItem
                  q={`Is ${game.name} still active?`}
                  a={isActive
                    ? `Yes, ${game.name} is still active with ${activity.activeLobbies} active ${activity.activeLobbies === 1 ? 'lobby' : 'lobbies'} and ${activity.activePlayers} ${activity.activePlayers === 1 ? 'player' : 'players'} looking for teammates in the last 7 days. You can join existing lobbies or start one.`
                    : `With Apoxer, yes. Lobbies, event and tournaments are being created by ${game.name}'s players. Start matchmaking now.`
                  }
                />
                <FAQItem
                  q="How do I find players?"
                  a={`Go to the ${game.name} page, browse active lobbies, or start one. Use lobby chat to coordinate quickly, then jump into the game.`}
                />
                <FAQItem
                  q="Is APOXER a Discord replacement?"
                  a="No. APOXER helps you discover active lobbies and players fast — then you coordinate and play wherever you want."
                />
                <FAQItem
                  q={`What if there are no lobbies for ${game.name}?`}
                  a={`Start the first one. When you create a lobby for ${game.name}, it becomes visible to other players who are browsing and searching.`}
                />
                <FAQItem
                  q="Is it free?"
                  a="Yes — APOXER is free to use."
                />
              </div>

              {/* Contact card */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-title font-semibold text-white mb-2">Need help?</h3>
                <p className="text-slate-300 text-sm mb-6">
                  Join the community, ask questions, or reach out directly.
                </p>

                <div className="space-y-3">
                  <a
                    href="https://discord.gg/3CRbvPw3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 border border-slate-700/50 rounded-lg px-4 py-3 hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="text-slate-200 text-sm">Join Discord</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>

                  <Link
                    href="/support"
                    className="flex items-center justify-between gap-3 border border-slate-700/50 rounded-lg px-4 py-3 hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="text-slate-200 text-sm">Support</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>

                  <a
                    href="mailto:contact@apoxer.com"
                    className="flex items-center justify-between gap-3 border border-slate-700/50 rounded-lg px-4 py-3 hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="text-slate-200 text-sm">contact@apoxer.com</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </a>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <p className="text-slate-400 text-xs">
                    Want your community listed? Coming soon.
                  </p>
                </div>
              </div>
            </div>
          </Section>
          
          {/* 9. FINAL CTA */}
          <Section>
            <div className="relative overflow-hidden border border-slate-700/50 rounded-xl p-12 text-center">
              {/* Background image (hero cover) */}
              {ctaHeroImage && (
                <Image
                  src={ctaHeroImage}
                  alt={`${game.name} hero`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority={false}
                />
              )}

              {/* Overlay (like lobby banner) */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
              <div className="absolute inset-0 bg-slate-900/40" />

              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-title font-bold text-white mb-4">
                  Ready to find players for {game.name}?
                </h2>
                <p className="text-slate-200 mb-8 max-w-2xl mx-auto">
                  {isActive
                    ? `Jump into active lobbies and start playing.`
                    : `Start matchmaking now — be the first to create activity for ${game.name}.`
                  }
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                  <Link
                    href={`/games/${gameId}`}
                    className="px-8 py-3 bg-cyan-400 text-slate-900 font-title font-medium rounded-lg hover:bg-cyan-400 transition-colors"
                  >
                    Find players
                  </Link>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, Users, Zap, Search, TrendingUp, Star, Bolt, Shield } from 'lucide-react'
import { getVerticalCover, searchGames } from '@/lib/steamgriddb'
import { unstable_cache } from 'next/cache'
import { YouTubeBackground } from '@/components/marketing/YouTubeBackground'
import { AnimatedSection } from '@/components/clean/AnimatedSection'
import { AnimatedDiv } from '@/components/clean/AnimatedDiv'
import { AnimatedList, AnimatedListItem } from '@/components/clean/AnimatedList'
import { AnimatedCard } from '@/components/clean/AnimatedCard'
import { AnimatedGallery } from '@/components/clean/AnimatedGallery'
import { AnimatedGameCover } from '@/components/clean/AnimatedGameCover'

// Curated list of popular multiplayer games to feature in hero
const FEATURED_GAME_NAMES = [
  'Call of Duty',
  'Mafia',
  'Assassin\'s Creed',
  'Battlefield',
  'eFootball',
]

// Extended list for "Why Apoxer exists" section gallery
const GALLERY_GAME_NAMES = [
  'Call of Duty 4',
  'Joey the Passion',
  'Age of Empire',
  'Battlefield 3',
  'Team Fortress 2',
  'PES 6',
]

interface GameCover {
  url: string | null
  thumb: string | null
  name: string
}

// Helper function to find game ID by name and fetch cover
async function fetchGameCoverByName(gameName: string): Promise<GameCover> {
  try {
    // Search for the game
    const searchResults = await searchGames(gameName)
    if (searchResults.length === 0) {
      return { url: null, thumb: null, name: gameName }
    }

    // Use the first verified result, or first result if none verified
    const game = searchResults.find(g => g.verified) || searchResults[0]
    
    // Fetch the cover
    const cover = await getVerticalCover(game.id)
    
    return {
      url: cover?.url || null,
      thumb: cover?.thumb || null,
      name: game.name,
    }
  } catch (error) {
    console.error(`Failed to fetch cover for ${gameName}:`, error)
    return { url: null, thumb: null, name: gameName }
  }
}

// Helper function to fetch game covers with caching
async function fetchGameCovers(): Promise<GameCover[]> {
  const covers = await Promise.all(
    FEATURED_GAME_NAMES.map(name => fetchGameCoverByName(name))
  )
  return covers.filter(c => c.thumb || c.url) // Only return covers that have images
}

// Helper function to fetch gallery game covers
async function fetchGalleryCovers(): Promise<GameCover[]> {
  const covers = await Promise.all(
    GALLERY_GAME_NAMES.map(name => fetchGameCoverByName(name))
  )
  return covers.filter(c => c.thumb || c.url) // Only return covers that have images
}

// Cache the covers for 1 hour
const getCachedCovers = unstable_cache(
  async () => fetchGameCovers(),
  ['hero-game-covers'],
  { revalidate: 3600 }
)

// Cache gallery covers for 1 hour
const getCachedGalleryCovers = unstable_cache(
  async () => fetchGalleryCovers(),
  ['gallery-game-covers'],
  { revalidate: 3600 }
)

export default async function CleanLandingPage() {
  // Fetch game covers (gracefully handles missing API key)
  let gameCovers: GameCover[] = []
  let galleryCovers: GameCover[] = []
  try {
    gameCovers = await getCachedCovers()
    galleryCovers = await getCachedGalleryCovers()
  } catch (error) {
    console.error('Failed to fetch game covers:', error)
    // Continue with empty array - will use fallback tiles
  }

  // Get the first 2 covers for the hero cluster
  const heroCovers = gameCovers.filter(c => c.thumb || c.url).slice(0, 2)
  
  // Main cover (large, top-left) - single anchor
  const mainCover = heroCovers[0] || null
  // Medium cover (bottom-left) - reduced size
  const mediumCover = heroCovers[1] || null
  
  // Get gallery covers (up to 12 for display)
  const displayGalleryCovers = galleryCovers.slice(0, 12)
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-title font-bold text-cyan-400">
              APOXER
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link href="#how-it-works" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                How it works
              </Link>
              <Link href="/features" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                Features
              </Link>
              <Link href="/blog" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                Blog
              </Link>
              <Link href="/auth/login" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                Sign in
              </Link>
              <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Link href="/auth/register">Join Apoxer</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 md:hidden">
              <Link href="/auth/login" className="text-sm text-slate-400">
                Sign in
              </Link>
              <Button asChild size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Link href="/auth/register">Join</Link>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <AnimatedSection className="relative overflow-hidden py-20 lg:py-32 min-h-[500px] lg:min-h-[600px] flex items-end">
        {/* YouTube video background */}
        <YouTubeBackground
          videoId="9DM7NsxOS0Q"
          startTime={30}
          endTime={90}
        />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl pb-8 lg:pb-12">
          {/* Left: Headline + CTA */}
          <div className="space-y-4">
            <AnimatedDiv delay={0.1}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-title font-bold leading-tight">
                Find perfectly matched
                <br />
                <span className="text-cyan-400">players</span>
              </h1>
            </AnimatedDiv>
            <AnimatedDiv delay={0.2}>
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-400">
                For old, new, and forgotten multiplayer games.
              </p>
            </AnimatedDiv>
            <AnimatedDiv delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white text-base px-8 py-5">
                  <Link href="/auth/register">Join Apoxer</Link>
                </Button>
              </div>
            </AnimatedDiv>
            <AnimatedDiv delay={0.4}>
              <p className="text-sm text-white/70 flex items-center gap-3 flex-wrap">
                <span>Free subscription</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Fast matchmaking</span>
              </p>
            </AnimatedDiv>
          </div>

          {/* Right: Media Cluster - Hidden for now */}
          <div className="relative hidden">
            <div className="grid grid-cols-3 gap-4">
              {/* Main Game Cover - Large (top-left) */}
              <div className="col-span-2 aspect-[4/3] relative group overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white/15">
                {mainCover?.thumb || mainCover?.url ? (
                  <>
                    <Image
                      src={(mainCover.thumb || mainCover.url) as string}
                      alt={mainCover.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                    {/* Live badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-cyan-500/90 backdrop-blur-sm border border-cyan-400/50 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-xs font-semibold text-white">12 active</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <span className="text-xs font-medium text-white/80 text-center px-2">Call of Duty</span>
                  </div>
                )}
              </div>
              
              {/* Avatar 1 - Circular chip */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/15 flex items-center justify-center shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white/20">
                <span className="text-sm font-semibold text-cyan-400">JD</span>
              </div>

              {/* Avatar 2 - Circular chip */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/15 flex items-center justify-center shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white/20">
                <span className="text-sm font-semibold text-cyan-400">MK</span>
              </div>

              {/* Medium Game Cover (bottom-left) - Reduced size to be subordinate */}
              <div className="col-span-2 aspect-[4/3] relative group overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white/15 scale-90 origin-left">
                {mediumCover?.thumb || mediumCover?.url ? (
                  <>
                    <Image
                      src={(mediumCover.thumb || mediumCover.url) as string}
                      alt={mediumCover.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                    <span className="text-xs font-medium text-white/80 text-center px-2">Mafia</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Section - From /landing TrustBanner */}
      <section className="relative z-10 py-12 lg:py-16 bg-slate-900/50 border-y border-slate-800/50">
        <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-cyan-500/10">
                <Star className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-white">5.0/5.0</div>
                <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                  USER RATING
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-cyan-500/10">
                <Bolt className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-white">FEES AS LOW AS 0%</div>
                <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                  ALWAYS FREE
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-cyan-500/10">
                <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-white">UP TO 100%</div>
                <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                  ACTIVE LOBBIES
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-cyan-500/10">
                <Users className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-white">10K+</div>
                <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                  GAMES INDEXED
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-cyan-500/10">
                <Shield className="w-6 h-6 lg:w-7 lg:h-7 text-cyan-400" />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-white">100K+</div>
                <div className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider">
                  HAPPY PLAYERS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why Apoxer exists */}
      <AnimatedSection className="border-t border-slate-800 bg-slate-950/50 py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-5">
              <AnimatedDiv delay={0.1}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-title font-bold">
                  Why Apoxer exists
                </h2>
              </AnimatedDiv>
              <AnimatedDiv delay={0.2}>
                <p className="text-lg sm:text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto">
                  Multiplayer communities are scattered across random Discords, dead forums, and forgotten servers…
                </p>
              </AnimatedDiv>
              <AnimatedDiv delay={0.3}>
                <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto">
                  If you grew up using Hamachi or GameRanger, you already know this problem.
                </p>
              </AnimatedDiv>
            </div>

            {/* Game Covers Gallery */}
            {displayGalleryCovers.length > 0 && (
              <AnimatedGallery className="py-8">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
                  {displayGalleryCovers.map((cover, index) => (
                    <AnimatedGameCover
                      key={index}
                      index={index}
                      className="flex-shrink-0 w-32 sm:w-40 aspect-[2/3] relative rounded-lg bg-slate-800 overflow-hidden"
                    >
                      {cover.thumb || cover.url ? (
                        <Image
                          src={(cover.thumb || cover.url) as string}
                          alt={cover.name}
                          fill
                          className="object-contain rounded-lg"
                          sizes="(max-width: 640px) 128px, 160px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center rounded-lg">
                          <span className="text-xs font-medium text-white/60 text-center px-2">{cover.name}</span>
                        </div>
                      )}
                    </AnimatedGameCover>
                  ))}
                </div>
              </AnimatedGallery>
            )}

            <AnimatedList className="space-y-4 pt-6 max-w-2xl mx-auto">
              <AnimatedListItem className="flex items-start gap-4">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <p className="text-base lg:text-lg text-slate-300">Too many servers. No discovery.</p>
              </AnimatedListItem>
              <AnimatedListItem className="flex items-start gap-4">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <p className="text-base lg:text-lg text-slate-300">Old games still have players — they just can't find each other.</p>
              </AnimatedListItem>
              <AnimatedListItem className="flex items-start gap-4">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <p className="text-base lg:text-lg text-slate-300">Discord preserves groups, but doesn't solve matchmaking.</p>
              </AnimatedListItem>
            </AnimatedList>
          </div>
        </div>
      </AnimatedSection>



      {/* Section 4: How it works (3 steps only, short) */}
      <AnimatedSection id="how-it-works" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedDiv delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-title font-bold text-center mb-12 lg:mb-16">
              How it works
            </h2>
          </AnimatedDiv>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            <AnimatedCard delay={0.2}>
              <Card className="border-slate-700 bg-slate-800/30 transition-all duration-200 ease-out hover:border-white/15">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl">Pick a game</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base lg:text-lg">
                    Search from thousands of multiplayer games, from classics to the latest releases.
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="border-slate-700 bg-slate-800/30 transition-all duration-200 ease-out hover:border-white/15">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl">Join or create a lobby</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base lg:text-lg">
                    Jump into active lobbies or start your own. Real-time chat connects you instantly.
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card className="border-slate-700 bg-slate-800/30 transition-all duration-200 ease-out hover:border-white/15">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl">Play + keep the community alive</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base lg:text-lg">
                    Connect, play, and help build lasting communities around the games you love.
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </AnimatedSection>

      {/* Section 5: Final CTA */}
      <AnimatedSection className="border-t border-slate-800 bg-slate-950/50 py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <AnimatedDiv delay={0.1}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-title font-bold text-white">
                Stop playing solo.
              </h2>
            </AnimatedDiv>
            <AnimatedDiv delay={0.2}>
              <p className="text-lg lg:text-xl text-slate-400">
                Join players discovering new matches every day.
              </p>
            </AnimatedDiv>
            <AnimatedDiv delay={0.3}>
              <div className="pt-2">
                <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white text-base px-8 py-5">
                  <Link href="/auth/register">Join Apoxer</Link>
                </Button>
              </div>
            </AnimatedDiv>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50">
        <div className="border-t border-slate-700/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Footer Content - Grid Layout */}
          <div className="grid grid-cols-4 gap-8 mb-12">
            {/* Column 1: General */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">General</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/features"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/billing"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Billing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Communities */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Communities</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/events"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tournaments"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/games"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Browse Games
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:contact@apoxer.com"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Email
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/3CRbvPw3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Games + Social Icons */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Games</h3>
              <ul className="space-y-3 mb-6">
                <li>
                  <Link
                    href="/is-joey-the-passion-still-active"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Joey the Passion
                  </Link>
                </li>
                <li>
                  <Link
                    href="/is-doom-still-active"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Doom
                  </Link>
                </li>
                <li>
                  <Link
                    href="/is-wolfenstein-still-active"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Wolfenstein
                  </Link>
                </li>
                <li>
                  <Link
                    href="/is-quake-still-active"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Quake
                  </Link>
                </li>
                <li>
                  <Link
                    href="/is-counter-strike-source-still-active"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    Counter Strike Source
                  </Link>
                </li>
              </ul>
              
              {/* Social Media Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://discord.gg/3CRbvPw3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a
                  href="https://twitter.com/apoxer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com/apoxer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-slate-700/50 mb-8"></div>

          {/* Bottom Section - Copyright */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-title text-lg font-bold">APOXER</span>
              <span className="text-slate-400 text-sm">
                © 2024 - {new Date().getFullYear()} APOXER
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


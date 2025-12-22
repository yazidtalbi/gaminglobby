import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Tags, Link2, Vote, UserCircle, Bell } from 'lucide-react'
import { Metadata } from 'next'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Features - Everything you need to find players',
  description: 'Discover all the features that make Apoxer the best platform for finding players and joining multiplayer game communities.',
}

export default function FeaturesPage() {
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
              <Link href="/clean#how-it-works" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
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

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-title font-bold text-white">
            Everything you need to find players
          </h1>
          <p className="text-xl text-slate-400">
            Built for multiplayer gaming, without the fluff.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Real-time lobbies */}
            <Card className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <Clock className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">Real-time lobbies</CardTitle>
                <p className="text-sm text-slate-400">Short-lived lobbies (15-min style) that expire after inactivity. See who&apos;s ready to play right now.</p>
              </CardHeader>
            </Card>

            {/* Player intent & tags */}
            <Card className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <Tags className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">Player intent & tags</CardTitle>
                <p className="text-sm text-slate-400">See play style, region, and what players are looking for. Match faster with compatible teammates.</p>
              </CardHeader>
            </Card>

            {/* Game directories */}
            <Card className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <Link2 className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">Game directories</CardTitle>
                <p className="text-sm text-slate-400">Find community links, Discord servers, guides, and more—all organized per game. No more scattered bookmarks.</p>
              </CardHeader>
            </Card>

            {/* Events & votes */}
            <Card className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <Vote className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">Events & votes</CardTitle>
                <p className="text-sm text-slate-400">Weekly community votes to revive old games. See upcoming events and tournaments organized by the community.</p>
              </CardHeader>
            </Card>

            {/* Lightweight profiles */}
            <Card className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <UserCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">Lightweight profiles</CardTitle>
                <p className="text-sm text-slate-400">Simple profiles focused on gaming. Find reliable teammates without social media noise.</p>
              </CardHeader>
            </Card>

            {/* Smart notifications */}
            <Card className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 mb-4">
                  <Bell className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle className="text-xl text-white mb-2">Smart notifications</CardTitle>
                <p className="text-sm text-slate-400">Opt-in notifications for lobbies, events, and community updates. You control what you see.</p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Moved from homepage */}
      <div className="relative mb-4 lg:mb-8 overflow-visible">
        <section className="relative" style={{ background: '#3CFFFF' }}>
          <div className="relative px-6 py-4 sm:px-8 sm:py-6 lg:px-16 lg:py-12 flex items-center min-h-[200px] lg:min-h-[450px] max-w-8xl mx-auto">
            <div className="text-left z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-title text-slate-900 mb-4">
                STOP PLAYING.
                <br />
                SOLO.
              </h2>
              <p className="hidden lg:block text-xs sm:text-base text-slate-900/80 max-w-md mb-6 max-w-lg font-medium">
                Join players discovering new matches every day?
              </p>
              <div className="w-full max-w-4xl">
                <div className="flex items-center gap-4 mb-0 lg:mb-6">
                  <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white text-base px-8 py-6 font-bold">
                    <Link href="/auth/register">JOIN APOXER</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <img 
          src="https://iili.io/f1shaUX.png" 
          alt="Hero character" 
          className="absolute bottom-0 right-0 mt-10 lg:mt-0"
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}


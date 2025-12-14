import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import Link from 'next/link'

export const metadata: Metadata = {
  ...createMetadata({
    title: 'About — Apoxer',
    description: 'Apoxer is a lobby-first matchmaking platform that helps players find real people to play with, especially for niche, older, or less popular multiplayer games.',
    path: '/about',
  }),
}

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-4 lg:pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-title text-white mb-6 leading-tight">
            Why is it still so hard to find people to play games with?
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
            Communities are scattered across Discord servers, dead forums, broken links, and private groups. Apoxer makes it easy to find players and form lobbies—right now.
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-16 max-w-3xl">
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            I've been replaying games I love lately — TF2, Battlefield 3, even older console titles — and I kept running into the same problem: finding people to actually play with is still way harder than it should be.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            Communities are scattered across random Discord servers, abandoned forums, expired invite links, and private groups. When official servers shut down, the community often disappears with them.
          </p>
          <p className="text-slate-400 text-xl font-medium italic leading-relaxed">
            Games get preserved.
            <br />
            Their communities don't.
          </p>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-16" />

        {/* The Solution */}
        <section className="mb-16 max-w-3xl">
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            Apoxer started as a small tool I built for myself — a way to see who's online right now, join short-lived lobbies around a game, and connect with players without hunting through dead links.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed">
            It's not about replacing communities.
            <br />
            It's about making them visible again.
          </p>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-16" />

        {/* What / Who / Why / Now */}
        <section className="mb-16">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* What */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-title text-white mb-3">What is Apoxer?</h3>
              <p className="text-slate-300 leading-relaxed">
                A lobby-first matchmaking platform that helps players find people to play with — across thousands of games.
              </p>
            </div>

            {/* Who */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-title text-white mb-3">Who is it for?</h3>
              <p className="text-slate-300 leading-relaxed">
                Gamers who struggle to find active players, especially for niche, older, or less-popular multiplayer games.
              </p>
            </div>

            {/* Why */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-title text-white mb-3">Why is it different?</h3>
              <p className="text-slate-300 leading-relaxed">
                Game-agnostic and lobby-based. No server hunting. No Discord chaos. Just players gathering around games.
              </p>
            </div>

            {/* Now */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-title text-white mb-3">What can I do now?</h3>
              <p className="text-slate-300 leading-relaxed">
                Join an active lobby — or create one and start playing.
              </p>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-16" />

        {/* CTAs */}
        <section className="mb-16 text-left">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors rounded-lg"
            >
              Explore lobbies
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-title transition-colors rounded-lg border border-slate-600"
            >
              Create a lobby
            </Link>
          </div>
        </section>

        {/* Trust Note */}
        <div className="max-w-3xl pt-8 border-t border-slate-700/50">
          <p className="text-sm text-slate-400 leading-relaxed">
            Apoxer is still early. If you join and something feels missing, that's intentional — it's built around real usage, not assumptions.
          </p>
        </div>
      </div>
    </div>
  )
}

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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-title text-white mb-6 leading-tight">
            About Apoxer
          </h1>
          <div className="mb-8 max-w-3xl   ">
            <p className="text-base text-white leading-relaxed mb-4">
              Apoxer started as a small tool I built for myself — a way to see who's online right now, join short-lived lobbies around a game, and connect with players without hunting through dead links.
            </p>
            <p className="text-base text-slate-300 leading-relaxed">
              It's not about replacing communities.
            </p>
            <p className="text-base text-cyan-400 leading-relaxed">
              It's about making them visible again.
            </p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-4 leading-tight">
              Manifesto
            </h2>
            <p className="text-base text-slate-300 max-w-3xl leading-relaxed mb-4">
              Communities are scattered across Discord servers, dead forums, broken links, and private groups. Apoxer makes it easy to find players and form lobbies—right now.
            </p>
            <p className="text-base text-slate-300 max-w-3xl leading-relaxed mb-4">
              I've been replaying games I love lately — TF2, Battlefield 3, even older console titles — and I kept running into the same problem: finding people to actually play with is still way harder than it should be.
            </p>
            <p className="text-base text-slate-300 max-w-3xl leading-relaxed mb-4">
              Communities are scattered across random Discord servers, abandoned forums, expired invite links, and private groups. When official servers shut down, the community often disappears with them.
            </p>
            <p className="text-base text-slate-400 font-medium italic leading-relaxed">
              Games get preserved.
              <br />
              Their communities don't.
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-12" />

        {/* Who is it for? */}
        <section className="mb-12">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-4 leading-tight">
              Who is it for?
            </h2>
            <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
              Gamers who struggle to find active players, especially for niche, older, or less-popular multiplayer games.
            </p>
          </div>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-12" />

        {/* Why is it different? */}
        <section className="mb-12">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-4 leading-tight">
              Why is it different?
            </h2>
            <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
              Game-agnostic and lobby-based. No server hunting. No Discord chaos. Just players gathering around games.
            </p>
          </div>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-12" />

        {/* What can I do now? */}
        <section className="mb-12">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-6 leading-tight">
              What can I do now?
            </h2>
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Create or join lobbies for any game and start playing immediately
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Chat with players in real-time using lobby chat
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Discover and join events scheduled around specific games
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Participate in tournaments and compete for rankings
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Follow other players and build your gaming network
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Invite friends and followed players to your lobbies
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Browse and search thousands of games across all platforms
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Build your game library and quickmatch your favorites
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Find gaming communities, Discord servers, and guides for any game
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  View recent players you've encountered in previous lobbies
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <p className="text-base text-slate-300 leading-relaxed">
                  Create and customize your profile with badges and endorsements
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-12" />

        {/* What is Apoxer? */}
        <section className="mb-12">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-title text-white mb-3">What is Apoxer?</h3>
            <p className="text-base text-slate-300 leading-relaxed">
              A lobby-first matchmaking platform that helps players find people to play with — across thousands of games.
            </p>
          </div>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-12" />

        {/* CTAs */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* TODO: Update to /explore if explore route is created */}
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors rounded-lg"
            >
              Explore lobbies
            </Link>
            {/* TODO: Update to /matchmaking if dedicated matchmaking route is created */}
            <Link
              href="/games"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-title transition-colors rounded-lg border border-slate-600"
            >
              Create a lobby
            </Link>
          </div>
        </section>

        {/* Separator */}
        <div className="border-t border-slate-700/50 my-12" />

        {/* Trust Note */}
        <div className="max-w-3xl">
          <p className="text-sm text-slate-400 leading-relaxed">
            Apoxer is still early. If you join and something feels missing, that's intentional — it's built around real usage, not assumptions.
          </p>
        </div>
      </div>
    </div>
  )
}

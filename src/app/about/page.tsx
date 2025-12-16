import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import Link from 'next/link'
import { Gamepad2, Users, Zap, Globe } from 'lucide-react'

export const metadata: Metadata = createMetadata({
  title: 'About Apoxer - What is Apoxer?',
  description: 'Learn about Apoxer, a gaming matchmaking platform that helps players find teammates, join lobbies, discover games, and connect with gaming communities worldwide.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-title text-white mb-4">What is Apoxer?</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Apoxer is a gaming matchmaking platform designed to help players find teammates, 
            join active lobbies, discover new games, and connect with gaming communities.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-3xl font-title text-white mb-6">Our Mission</h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            We believe that gaming is better when shared. Apoxer connects players across thousands 
            of games, making it easy to find teammates, join lobbies, participate in events, and 
            build lasting gaming communities.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed">
            Whether you&apos;re looking for a quick match, organizing a tournament, or discovering 
            new gaming communities, Apoxer provides the tools and platform to make it happen.
          </p>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-title text-white mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gamepad2 className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Game Discovery</h3>
              </div>
              <p className="text-slate-300">
                Search and browse thousands of games, build your library, and discover 
                active communities for any game.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Player Matchmaking</h3>
              </div>
              <p className="text-slate-300">
                Find players who share your gaming interests, follow them, and invite 
                them to your lobbies.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Live Lobbies</h3>
              </div>
              <p className="text-slate-300">
                Create and join game lobbies with real-time chat, ready status, and 
                seamless team coordination.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Community Events</h3>
              </div>
              <p className="text-slate-300">
                Participate in weekly community votes, join scheduled events, and 
                compete in tournaments.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-slate-800/50 border border-slate-700/50 p-8 rounded-xl">
          <h2 className="text-2xl font-title text-white mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-6">
            Join thousands of players already using Apoxer to find teammates and build their gaming network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-title font-bold transition-colors inline-block"
            >
              Sign Up Free
            </Link>
            <Link
              href="/features"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-title transition-colors inline-block"
            >
              View Features
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Check } from '@mui/icons-material'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-left">
          <h1 className="text-5xl font-title text-white mb-4">About Apoxer</h1>
          <p className="text-lg text-slate-300 max-w-xl">
            A new way to play - Find players fast, join active lobbies, and match with teammates who actually fit your style.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">Our Mission</h2>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 space-y-4">
            <p className="text-slate-300 text-lg leading-relaxed">
              Apoxer exists for one purpose: to make finding players effortless.
            </p>
            <p className="text-slate-300 text-lg leading-relaxed">
              Gaming is better when shared, and our mission is to help people connect faster, team up smarter, and enjoy multiplayer without friction.
            </p>
          </div>
        </section>

        {/* The Problem & Solution */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            {/* The Problem */}
            <div>
              <h2 className="text-3xl font-title text-white mb-6">The Problem</h2>
              <div className="bg-slate-800/50 border border-slate-700/50 p-6">
                <p className="text-slate-300 text-lg leading-relaxed">
                  While games are being preserved physically and digitally, their communities often aren't.
                </p>
                <p className="text-slate-300 text-lg leading-relaxed mt-4">
                  Players get scattered across forums, Discords, Mumbles, private servers, and unofficial hubs—especially when official servers shut down.
                </p>
              </div>
            </div>

            {/* The Solution */}
            <div>
              <h2 className="text-3xl font-title text-white mb-6">The Solution</h2>
              <div className="bg-slate-800/50 border border-slate-700/50 p-6">
                <p className="text-slate-300 text-lg leading-relaxed">
                  Apoxer brings all of that back together.
                </p>
                <p className="text-slate-300 text-lg leading-relaxed mt-4">
                  Instantly discover the active directories, voice hubs, Discord servers, and community spaces for any game, all in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section className="mb-12">
          <div className="bg-slate-800/50 border border-slate-700/50 p-6">
            <p className="text-slate-300 text-lg leading-relaxed">
              With support for <span className="text-cyan-400 font-bold">50,000+ games</span>, Apoxer delivers fast matchmaking, real-time lobby management, and community-driven events that unite players—wherever they are, and whenever they're ready to play.
            </p>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Player-Focused</h3>
              <p className="text-slate-300">
                Built by gamers, for gamers. Every feature is designed with the player experience in mind.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Community-Driven</h3>
              <p className="text-slate-300">
                Weekly events and voting systems let the community decide what games to play together.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Fast & Reliable</h3>
              <p className="text-slate-300">
                Real-time updates and optimized performance ensure you never miss a match.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Inclusive</h3>
              <p className="text-slate-300">
                Support for all platforms and games means everyone can find their place in the community.
              </p>
            </div>
          </div>
        </section>

        {/* Tournaments Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-title text-white">Competitive Tournaments</h2>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-title uppercase">
                Apex Feature
              </span>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              For Apex members, Apoxer offers a complete tournament system that brings organized competition to your gaming community. 
              Create single-elimination brackets, manage matches with screenshot verification, and reward winners with custom badges and free Apex time.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/70 border border-amber-500/30 p-6">
                <h3 className="text-xl font-title text-amber-400 mb-3">Tournament Creation</h3>
                <p className="text-slate-300">
                  Apex members can create tournaments for 8 or 16 participants, set custom prize badges, and manage the entire competition lifecycle from registration to final results.
                </p>
              </div>
              <div className="bg-slate-800/70 border border-amber-500/30 p-6">
                <h3 className="text-xl font-title text-amber-400 mb-3">Match Management</h3>
                <p className="text-slate-300">
                  Players submit match reports with screenshots, hosts review and finalize results, and the system automatically advances winners through the bracket.
                </p>
              </div>
              <div className="bg-slate-800/70 border border-amber-500/30 p-6">
                <h3 className="text-xl font-title text-amber-400 mb-3">Prize System</h3>
                <p className="text-slate-300">
                  Winners earn custom badges displayed on their profiles, plus free Apex membership time—7 days for champions, 3 days for finalists.
                </p>
              </div>
              <div className="bg-slate-800/70 border border-amber-500/30 p-6">
                <h3 className="text-xl font-title text-amber-400 mb-3">Community Recognition</h3>
                <p className="text-slate-300">
                  Tournament achievements are permanently displayed on player profiles, creating lasting recognition for competitive accomplishments.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/features"
                className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-title transition-colors"
              >
                Learn More About Tournaments
              </Link>
            </div>
          </div>
        </section>


        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-title text-white mb-4">Ready to find your squad?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors inline-block"
            >
              Get Started
            </Link>
            <Link
              href="/features"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-title transition-colors inline-block border border-slate-600"
            >
              View Features
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}


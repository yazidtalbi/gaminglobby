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
          <p className="text-xl text-slate-300">
            A new way to play - Find players fast, join active lobbies, and match with teammates who actually fit your style.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">Our Mission</h2>
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Apoxer was created by one person who just wanted an easier way to find people to play with. We believe gaming is better when shared, and our mission is to make it effortless for gamers to connect, form teams, and build lasting gaming friendships.
            </p>
            <p className="text-slate-300 text-lg leading-relaxed">
              Our platform supports <span className="text-cyan-400 font-bold">50,000+ games</span> and provides fast matchmaking, real-time lobby management, and community-driven events to bring gamers together.
            </p>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Player-Focused</h3>
              <p className="text-slate-300">
                Built by gamers, for gamers. Every feature is designed with the player experience in mind.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Community-Driven</h3>
              <p className="text-slate-300">
                Weekly events and voting systems let the community decide what games to play together.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Fast & Reliable</h3>
              <p className="text-slate-300">
                Real-time updates and optimized performance ensure you never miss a match.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <h3 className="text-xl font-title text-cyan-400 mb-3">Inclusive</h3>
              <p className="text-slate-300">
                Support for all platforms and games means everyone can find their place in the community.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-12">
          <h2 className="text-3xl font-title text-white mb-6">Technology</h2>
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
            <p className="text-slate-300 mb-4">
              Apoxer is built with modern web technologies to deliver a fast, reliable, and secure experience:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-title mb-1">Next.js 14</h4>
                  <p className="text-slate-400 text-sm">Fast, server-rendered React framework</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-title mb-1">TypeScript</h4>
                  <p className="text-slate-400 text-sm">Type-safe code for reliability</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-title mb-1">Supabase</h4>
                  <p className="text-slate-400 text-sm">Real-time database and authentication</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-title mb-1">Tailwind CSS</h4>
                  <p className="text-slate-400 text-sm">Beautiful, responsive design</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-title mb-1">SteamGridDB</h4>
                  <p className="text-slate-400 text-sm">Comprehensive game database</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section className="mb-12">
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6 text-center">
            <p className="text-slate-300 text-lg">
              Made by one person who just wanted an easier way to find people to play with.
            </p>
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


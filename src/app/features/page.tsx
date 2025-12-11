'use client'

import Link from 'next/link'
import { 
  SportsEsports, 
  Home, 
  People, 
  Event, 
  MenuBook, 
  Notifications,
  AutoAwesome,
  Star,
  Bolt,
  Celebration,
  Collections,
  Palette
} from '@mui/icons-material'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-left">
          <h1 className="text-5xl font-title text-white mb-4">Features</h1>
          <p className="text-xl text-slate-300">
            Everything you need to find teammates, join lobbies, and build your gaming community
          </p>
        </div>

        {/* Core Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-title text-white mb-8">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Game Discovery */}
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <SportsEsports className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Game Discovery & Search</h3>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Search any game from 50,000+ games</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Build your personal game library</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Explore detailed game pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Quick matchmaking with one click</span>
                </li>
              </ul>
            </div>

            {/* Lobby System */}
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Home className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Lobby System</h3>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Create custom game lobbies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Real-time chat with teammates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Ready/Not Ready status system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Host controls (kick/ban)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Platform selection (PC, Console, Mobile)</span>
                </li>
              </ul>
            </div>

            {/* Social Features */}
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <People className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Social Features</h3>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Customizable player profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Follow other players</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Player endorsements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Recent players tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>User reporting system</span>
                </li>
              </ul>
            </div>

            {/* Weekly Events */}
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Event className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Weekly Community Events</h3>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Vote on games for weekly events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Choose preferred time slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Join 6-hour gaming events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Real-time vote updates</span>
                </li>
              </ul>
            </div>

            {/* Game Resources */}
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MenuBook className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Game Resources</h3>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Discover Discord servers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Access user-submitted guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>View game statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Community resources per game</span>
                </li>
              </ul>
            </div>

            {/* Invites & Notifications */}
            <div className="bg-slate-800/50 border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Notifications className="w-8 h-8 text-cyan-400" />
                <h3 className="text-xl font-title text-white">Invites & Notifications</h3>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Receive lobby invitations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Real-time notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Manage pending invites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Instant lobby updates</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Premium Features */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-8 h-8 text-amber-400" />
            <h2 className="text-3xl font-title text-white">Premium Features (Pro Plan)</h2>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 p-8 mb-6">
            <p className="text-slate-300 text-lg mb-6 text-center">
              Upgrade to <span className="text-amber-400 font-bold">Apoxer Pro</span> ($9.99/month) to unlock advanced features:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Auto-Invite */}
              <div className="bg-slate-800/50 border border-amber-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bolt className="w-6 h-6 text-amber-400" />
                  <h3 className="text-lg font-title text-white">Auto-Invite System</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Automatically invite other online players who have added the same game. One-click setup to instantly fill your team.
                </p>
              </div>

              {/* Event Creation */}
              <div className="bg-slate-800/50 border border-amber-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Celebration className="w-6 h-6 text-amber-400" />
                  <h3 className="text-lg font-title text-white">Event Creation & Management</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Create and manage your own gaming events. Get your events featured and track participation analytics.
                </p>
              </div>

              {/* Collections */}
              <div className="bg-slate-800/50 border border-amber-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Collections className="w-6 h-6 text-amber-400" />
                  <h3 className="text-lg font-title text-white">Collections <span className="text-xs text-slate-400">(Coming Soon)</span></h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Organize your games into custom collections and share them with the community.
                </p>
              </div>

              {/* Profile Enhancements */}
              <div className="bg-slate-800/50 border border-amber-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Palette className="w-6 h-6 text-amber-400" />
                  <h3 className="text-lg font-title text-white">Profile Enhancements</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Custom banners, Pro badge, and enhanced visibility to stand out in the community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-title text-white mb-4">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors inline-block"
            >
              Sign Up Free
            </Link>
            <Link
              href="/billing"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-title transition-colors inline-block"
            >
              Upgrade to Pro
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}


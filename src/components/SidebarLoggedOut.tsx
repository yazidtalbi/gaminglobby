'use client'

import { Gamepad2, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'

export function SidebarLoggedOut() {
  return (
    <aside className="hidden lg:block fixed left-0 top-16 bottom-0 bg-slate-900/50 border-r border-slate-800 overflow-y-auto overflow-x-visible z-40 transition-all duration-300 w-72">
      <div className="p-4 pb-6 flex flex-col h-full">
        {/* Library Title - Outside card, like navbar */}
        <div className="mb-4">
          <h2 className="text-base font-title text-slate-400">
            LIBRARY
          </h2>
        </div>

        {/* Library Card */}
        <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-300 mb-1 font-medium">Add your first game</p>
          <p className="text-sm text-slate-400 mb-4">Quickmatch your favorites</p>
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-title transition-colors rounded-lg border border-slate-600"
          >
            Sign in
          </Link>
        </div>

        {/* Events Card */}
        <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-300 mb-1 font-medium">Create an event in seconds</p>
          <p className="text-sm text-slate-400 mb-4">Schedule a time to gather people to hop in your favorite game</p>
          <Link
            href="/events"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-title transition-colors rounded-lg border border-slate-600"
          >
            Explore the events
          </Link>
        </div>

        {/* About Link at Bottom - Left aligned */}
        <div className="mt-auto pt-4 border-t border-slate-700/50">
          <Link
            href="/about"
            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
          >
            About Apoxer
          </Link>
        </div>
      </div>
    </aside>
  )
}


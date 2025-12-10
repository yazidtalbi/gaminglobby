'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePendingInvites } from '@/hooks/usePendingInvites'
import { GameSearch } from './GameSearch'
import { Home, Gamepad2, LogIn, ChevronDown, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useAuth()
  const pendingInvitesCount = usePendingInvites(user?.id || null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-slate-800/90 backdrop-blur-sm border-b border-cyan-500/30">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Nav Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-white font-title text-xl py-4">
              LOBBYHUB
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-title transition-colors relative py-4 ${
                  pathname === '/'
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
                {pathname === '/' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </Link>
              <Link
                href="/games"
                className={`text-sm font-title transition-colors relative py-4 ${
                  pathname.startsWith('/games')
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Games
                {pathname.startsWith('/games') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </Link>
              <Link
                href="/invites"
                className={`text-sm font-title transition-colors relative flex items-center gap-2 py-4 ${
                  pathname === '/invites'
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Invites
                {typeof pendingInvitesCount === 'number' && pendingInvitesCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-orange-500" />
                )}
                {pathname === '/invites' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </Link>
              <Link
                href="/recent-players"
                className={`text-sm font-title transition-colors relative py-4 ${
                  pathname === '/recent-players'
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recent Players
                {pathname === '/recent-players' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </Link>
              <Link
                href="/events"
                className={`text-sm font-title transition-colors relative py-4 ${
                  pathname.startsWith('/events')
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Events
                {pathname.startsWith('/events') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </Link>
            </div>
          </div>

          {/* Auth / Profile */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="max-w-md">
              <GameSearch 
                placeholder="Search games..." 
                size="sm"
                className="w-full"
              />
            </div>
            {loading ? (
              <div className="w-8 h-8 bg-slate-700 animate-pulse border border-slate-600" />
            ) : user && profile ? (
              <>
                {/* Profile Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-800 border border-transparent hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="w-8 h-8 overflow-hidden bg-slate-700 border border-slate-600 rounded-full">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-cyan-500/30 shadow-xl overflow-hidden p-3">
                      <div className="mb-2">
                        <p className="text-sm text-slate-400 text-center">Currently in</p>
                      </div>
                      <Link
                        href={`/u/${profile.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="block bg-slate-900 border border-slate-700 p-4 mb-2 hover:bg-slate-900/80 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Profile Picture */}
                          <div className="w-12 h-12 overflow-hidden bg-slate-700 border border-slate-600 flex-shrink-0 rounded-full">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-base truncate">{profile.username}</p>
                            <p className="text-sm text-slate-400">Personal</p>
                            <p className="text-sm text-slate-400 truncate">{user?.email || 'No email'}</p>
                          </div>
                        </div>
                      </Link>
                      
                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          signOut()
                          setShowDropdown(false)
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors border border-cyan-500"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:block">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

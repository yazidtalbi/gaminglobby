'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { GameSearch } from './GameSearch'
import { Home, Gamepad2, LogIn, User, ChevronDown, LogOut, Bell } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useAuth()
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

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-emerald-400 font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block">LobbyHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/" active={isActive('/')}>
                <Home className="w-4 h-4" />
                Home
              </NavLink>
              <NavLink href="/games" active={pathname.startsWith('/games')}>
                <Gamepad2 className="w-4 h-4" />
                Games
              </NavLink>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <GameSearch 
              placeholder="Search games..." 
              size="sm"
              className="w-full"
            />
          </div>

          {/* Auth / Profile */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            ) : user && profile ? (
              <>
                {/* Invites Bell */}
                <Link
                  href="/invites"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                </Link>

                {/* Profile Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-white max-w-24 truncate">
                      {profile.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                      <Link
                        href={`/u/${profile.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          signOut()
                          setShowDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700"
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
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
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

function NavLink({ 
  href, 
  active, 
  children 
}: { 
  href: string
  active: boolean
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${active 
          ? 'bg-slate-800 text-emerald-400' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }
      `}
    >
      {children}
    </Link>
  )
}


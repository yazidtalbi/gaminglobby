'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePendingInvites } from '@/hooks/usePendingInvites'
import { Search, Menu, Library, Home, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Settings, Logout } from '@mui/icons-material'
import { AboutDrawer } from '@/components/AboutDrawer'

export function BottomNavbar() {
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useAuth()
  const pendingInvitesCount = usePendingInvites(user?.id || null)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hasNewInvites = typeof pendingInvitesCount === 'number' && pendingInvitesCount > 0

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [showMenu])

  // Hide on auth pages and onboarding
  if (pathname?.startsWith('/auth/') || pathname === '/onboarding') return null

  const isDiscoverActive = pathname === '/'
  const isLibraryActive = pathname === '/library'

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex h-14 items-center justify-around">
          {/* Discover */}
          <Link
            href="/"
            className={[
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full',
              'text-xs font-title font-semibold uppercase tracking-wider',
              isDiscoverActive ? 'text-cyan-400' : 'text-slate-400',
            ].join(' ')}
          >
            <Home className="w-5 h-5" />
            <span>Discover</span>
          </Link>

          {/* Search */}
          <Link
            href="/games"
            className={[
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full',
              'text-xs font-title font-semibold uppercase tracking-wider',
              pathname === '/games' ? 'text-cyan-400' : 'text-slate-400',
            ].join(' ')}
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </Link>

          {/* Library */}
          <Link
            href="/library"
            className={[
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full',
              'text-xs font-title font-semibold uppercase tracking-wider',
              isLibraryActive ? 'text-cyan-400' : 'text-slate-400',
            ].join(' ')}
          >
            <Library className="w-5 h-5" />
            <span>Library</span>
          </Link>

          {/* Avatar - leads to user profile */}
          <Link
            href={user && profile ? `/u/${profile.username || profile.id}` : '/social'}
            className={[
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full',
              'text-xs font-title font-semibold uppercase tracking-wider',
              pathname?.startsWith('/u/') ? 'text-cyan-400' : 'text-slate-400',
            ].join(' ')}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username || 'Avatar'}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center">
                <span className="text-xs text-white font-bold">?</span>
              </div>
            )}
            <span className="text-[10px]">Profile</span>
          </Link>

          {/* Hamburger Menu */}
          <button
            onClick={() => setShowMenu(true)}
            className={[
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full',
              'text-xs font-title font-semibold uppercase tracking-wider',
              'text-slate-400',
            ].join(' ')}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {hasNewInvites && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
              )}
            </div>
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Full Screen Menu */}
      {showMenu && (
        <div ref={menuRef} className="fixed inset-0 z-[60] bg-slate-900 lg:hidden">
          <div className="flex h-full flex-col">
            {/* Header with Close Button */}
            <div className="flex items-center justify-end border-b border-slate-800 p-4">
              <button
                onClick={() => setShowMenu(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Connected Account Section */}
              {user && profile && (
                <div className="border-b border-slate-800 p-4">
                  <Link
                    href={`/u/${profile.username || profile.id}`}
                    onClick={() => setShowMenu(false)}
                    className="block border border-slate-800 bg-slate-900 p-4 hover:bg-slate-900/70"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={[
                          'h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-800',
                          profile.plan_tier === 'founder'
                            ? 'border border-purple-400'
                            : profile.plan_tier === 'pro' &&
                              (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())
                              ? 'border border-yellow-400'
                              : 'border border-slate-800',
                        ].join(' ')}
                      >
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-b from-[#172133] to-[#7C8BB3] flex items-center justify-center">
                            <span className="text-xl text-white font-bold">?</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-white">
                          {profile.display_name || profile.username}
                        </p>
                        {profile.display_name && profile.display_name !== profile.username && (
                          <p className="truncate text-sm text-slate-400">@{profile.username}</p>
                        )}
                        <p className="truncate text-sm text-slate-400">{user?.email || 'No email'}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <div className="border-b border-slate-800 p-4">
                <div className="flex flex-col gap-4">
                  <Link
                    href="/social"
                    onClick={() => setShowMenu(false)}
                    className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    Community
                  </Link>
                  <Link
                    href="/events"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    <span>Events</span>
                    <span className="rounded-sm border border-slate-800 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-title font-bold tracking-[0.14em] text-cyan-300">
                      BETA
                    </span>
                  </Link>
                  <Link
                    href="/invites"
                    onClick={() => setShowMenu(false)}
                    className="relative flex items-center gap-2 text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    <span>Invites</span>
                    {hasNewInvites && (
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                    )}
                  </Link>
                </div>
              </div>

              {/* Footer Links - Vertical */}
              <div className="border-b border-slate-800 p-4">
                <div className="flex flex-col gap-4">
                  <AboutDrawer>
                    <button
                      type="button"
                      onClick={() => setShowMenu(false)}
                      className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors text-left"
                    >
                      About
                    </button>
                  </AboutDrawer>
                  <Link
                    href="/features"
                    onClick={() => setShowMenu(false)}
                    className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => setShowMenu(false)}
                    className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    Billing
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setShowMenu(false)}
                    className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    Support
                  </Link>
                  <Link
                    href="/roadmap"
                    onClick={() => setShowMenu(false)}
                    className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                  >
                    Roadmap
                  </Link>
                </div>
              </div>

              {/* Upgrade to Apex */}
              {user && (!profile?.plan_tier || profile.plan_tier === 'free' || (profile.plan_tier === 'pro' && profile.plan_expires_at && new Date(profile.plan_expires_at) <= new Date())) && (
                <div className="border-b border-slate-800 p-4">
                  <Link
                    href="/billing"
                    onClick={() => setShowMenu(false)}
                    className="block w-full border border-cyan-400 bg-cyan-500/10 px-6 py-4 text-center text-base font-title font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                  >
                    Upgrade to Apex
                  </Link>
                </div>
              )}

              {/* Settings and Sign Out */}
              {user && (
                <div className="border-t border-slate-800 p-4">
                  <div className="flex flex-col gap-4">
                    <Link
                      href="/settings"
                      onClick={() => setShowMenu(false)}
                      className="text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setShowMenu(false)
                      }}
                      className="text-left text-base font-title font-semibold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Sign In (if not logged in) */}
              {!user && !loading && (
                <div className="p-4">
                  <Link
                    href="/auth/login"
                    onClick={() => setShowMenu(false)}
                    className="block w-full border border-cyan-400 bg-cyan-400 px-6 py-4 text-center text-base font-title font-bold uppercase tracking-wider text-slate-900 hover:bg-cyan-300 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}

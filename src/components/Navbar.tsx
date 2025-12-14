'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePendingInvites } from '@/hooks/usePendingInvites'
import { MatchmakingModal } from './MatchmakingModal'
import { NavbarSearchModal } from './NavbarSearchModal'
import { Search, ExpandMore, Login, Logout, Settings } from '@mui/icons-material'
import { useState, useRef, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/', label: 'Discover', match: (p: string) => p === '/' },
  { href: '/games', label: 'Games', match: (p: string) => p.startsWith('/games') },
  { href: '/social', label: 'Community', match: (p: string) => p === '/social' },
  { href: '/events', label: 'Events', match: (p: string) => p.startsWith('/events') },
  { href: '/tournaments', label: 'Tournaments', badge: 'BETA', match: (p: string) => p.startsWith('/tournaments') },
  { href: '/invites', label: 'Invites', match: (p: string) => p === '/invites' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useAuth()
  const pendingInvitesCount = usePendingInvites(user?.id || null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false)
  const [showNavbarSearchModal, setShowNavbarSearchModal] = useState(false)
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

  // Hide navbar on auth pages and onboarding
  if (pathname?.startsWith('/auth/') || pathname === '/onboarding') return null

  return (
    <nav className="hidden lg:block sticky top-0 z-50 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
      {/* full-width bar like the screenshot */}
      <div className="w-full">
        <div className="flex h-14 items-center">
          {/* LEFT: logo slot */}
          <div className="flex h-full items-center border-r border-slate-800 px-5">
            <Link href="/" className="flex items-center gap-3 select-none">
              <img src="/logo.png" alt="Apoxer" className="h-5 w-5" />
            </Link>
          </div>

          {/* CENTER: nav tabs */}
          <div className="flex h-full flex-1 items-center px-6">
            <div className="flex h-full items-stretch gap-7">
              {NAV_ITEMS.map((item) => {
                const isActive = item.match(pathname || '')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'relative flex h-full items-center gap-2',
                      'text-base font-title font-semibold uppercase tracking-[0.18em]',
                      isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>

                    {item.badge ? (
                      <span className={[
                        'ml-1 rounded-sm border px-2 py-[1px] text-[11px] font-title font-bold tracking-[0.14em]',
                        item.badge === 'BETA'
                          ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-400'
                          : 'border-slate-800 bg-cyan-500/10 text-cyan-300'
                      ].join(' ')}>
                        {item.badge}
                      </span>
                    ) : null}

                    {item.label === 'Invites' &&
                      typeof pendingInvitesCount === 'number' &&
                      pendingInvitesCount > 0 && (
                        <span className="ml-1 h-2 w-2 bg-orange-500" />
                      )}

                    {/* active underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT: search zone (with vertical separators) */}
          <div className="flex h-full items-center border-l border-slate-800">
            <button
              type="button"
              onClick={() => setShowNavbarSearchModal(true)}
              className="flex h-full items-center gap-3 border-l border-slate-800 px-6 text-left hover:bg-white/[0.02]"
            >
              <Search className="text-slate-400" sx={{ fontSize: 18 }} />
            </button>
          </div>

          {/* AUTH / PROFILE (kept, but visually “quiet” so it doesn’t fight the screenshot) */}
          <div className="flex h-full items-center border-l border-slate-800">
            {loading ? (
              <div className="h-8 w-8 animate-pulse border border-slate-800 bg-slate-900" />
            ) : user && profile ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-4 border border-transparent px-3 py-1 hover:border-slate-800 hover:bg-white/[0.02]"
                >
                  <div
                    className={[
                      'h-8 w-8 overflow-hidden rounded-full bg-slate-800',
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
                      <div className="h-full w-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                    )}
                  </div>

                  <div className="flex flex-col items-start min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {profile.username}
                    </p>
                    {profile.display_name && (
                      <p className="truncate text-xs text-slate-400">{profile.display_name}</p>
                    )}
                  </div>

                  {profile.plan_tier === 'founder' && (
                      <span className="flex items-center gap-1 bg-purple-500 px-1 py-0 text-xs font-title font-bold uppercase text-white">
                        <span className="h-0 w-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-white" />
                        FOUNDER
                      </span>
                    )}
                  {profile.plan_tier === 'pro' &&
                    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date()) && (
                      <span className="flex items-center gap-1 bg-amber-400 px-1 py-0 text-xs font-title font-bold uppercase text-slate-900">
                        <span className="h-0 w-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-slate-900" />
                        APEX
                      </span>
                    )}

                  <ExpandMore className="text-slate-400" sx={{ fontSize: 18 }} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
                    <div className="p-3">
                      <p className="mb-2 text-center text-sm text-slate-400">Currently in</p>

                      <Link
                        href={`/u/${profile.username || profile.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="mb-2 block border border-slate-800 bg-slate-900 p-4 hover:bg-slate-900/70"
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
                              <div className="h-full w-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-bold text-white">
                              {profile.display_name || profile.username}
                            </p>
                            {profile.display_name && profile.display_name !== profile.username && (
                              <p className="truncate text-sm text-slate-400">@{profile.username}</p>
                            )}
                            <p className="text-sm text-slate-400">Personal</p>
                            <p className="truncate text-sm text-slate-400">{user?.email || 'No email'}</p>
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="mb-2 flex w-full items-center justify-center gap-2 border border-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.02] hover:text-white"
                      >
                        <Settings sx={{ fontSize: 18 }} />
                        Settings
                      </Link>

                      <button
                        onClick={() => {
                          signOut()
                          setShowDropdown(false)
                        }}
                        className="flex w-full items-center justify-center gap-2 border border-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.02] hover:text-white"
                      >
                        <Logout sx={{ fontSize: 18 }} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex h-full w-full items-center justify-center gap-2 bg-cyan-400 px-8 text-md font-medium text-slate-900 hover:bg-cyan-400"
              >
              
                <span className="hidden sm:block font-title font-bold">Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        trendingGames={[]}
      />
      <NavbarSearchModal
        isOpen={showNavbarSearchModal}
        onClose={() => setShowNavbarSearchModal(false)}
      />
    </nav>
  )
}

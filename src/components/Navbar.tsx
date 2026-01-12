'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePendingInvites } from '@/hooks/usePendingInvites'
import { MatchmakingModal } from './MatchmakingModal'
import { NavbarSearchModal } from './NavbarSearchModal'
import { ProgressBar } from './ProgressBar'
import { Search, ExpandMore, Login, Logout, Settings, Notifications } from '@mui/icons-material'
import { useState, useRef, useEffect } from 'react'
import { Avatar } from './Avatar'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

const NAV_ITEMS = [
  { href: '/social', label: 'Community', match: (p: string) => p === '/social' },
  { href: '/events', label: 'Events', match: (p: string) => p.startsWith('/events') },
  { href: '/tournaments', label: 'Tournaments', badge: 'BETA', match: (p: string) => p.startsWith('/tournaments') },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading, signOut } = useAuth()
  const pendingInvitesCount = usePendingInvites(user?.id || null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false)
  const [showNavbarSearchModal, setShowNavbarSearchModal] = useState(false)
  const [gamesSearchQuery, setGamesSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const gamesSearchInputRef = useRef<HTMLInputElement>(null)

  // Sync with URL params when on /games page
  useEffect(() => {
    if (pathname?.startsWith('/games')) {
      const query = searchParams?.get('q') || ''
      if (query !== gamesSearchQuery) {
        setGamesSearchQuery(query)
      }
    } else {
      setGamesSearchQuery('')
    }
  }, [pathname, searchParams])

  // Handle games search navigation - update URL when query changes (debounced)
  const debouncedGamesQuery = useDebounce(gamesSearchQuery, 300)
  
  useEffect(() => {
    if (pathname?.startsWith('/games')) {
      const currentQuery = searchParams?.get('q') || ''
      // Only update URL if the debounced query is different from URL
      if (debouncedGamesQuery !== currentQuery) {
        const url = debouncedGamesQuery 
          ? `/games?q=${encodeURIComponent(debouncedGamesQuery)}`
          : '/games'
        router.replace(url, { scroll: false })
      }
    }
  }, [debouncedGamesQuery])

  const handleGamesSearchClick = () => {
    if (!pathname?.startsWith('/games')) {
      router.push('/games')
      // Focus the input after navigation
      setTimeout(() => {
        gamesSearchInputRef.current?.focus()
      }, 100)
    } else {
      gamesSearchInputRef.current?.focus()
    }
  }

  const handleGamesSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setGamesSearchQuery(newValue)
    // Navigate to /games if not already there
    if (!pathname?.startsWith('/games')) {
      router.push(newValue ? `/games?q=${encodeURIComponent(newValue)}` : '/games')
    }
  }

  const isGamesPageActive = pathname?.startsWith('/games')

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
    <>
      <ProgressBar />
      <nav className="hidden lg:block sticky top-0 z-50 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        {/* full-width bar like the screenshot */}
        <div className="w-full">
        <div className="flex h-14 items-center">
          {/* LEFT: logo slot */}
          <div className="flex h-full items-center border-r border-slate-800 px-5">
            <Link href="/" className="flex items-center gap-3 select-none">
              <img src="/logo.png" alt="Apoxer" className="h-5 w-5" />
              <span className="text-white font-title text-lg font-bold">APOXER</span>
            </Link>
          </div>

          {/* CENTER: nav tabs */}
          <div className="flex h-full flex-1 items-center pr-6">
            <div className="flex h-full items-stretch gap-7">
              {/* Games Search Input - First item (replaces Discover) */}
              <div className="relative flex h-full items-center">
                <div className="relative group h-full flex items-center">
                  <input
                    ref={gamesSearchInputRef}
                    type="text"
                    value={gamesSearchQuery}
                    onChange={handleGamesSearchChange}
                    onClick={handleGamesSearchClick}
                    placeholder="Search your favorite game.."
                    className={[
                      'h-full pl-3 pr-3 bg-slate-800/50 border rounded',
                      'text-sm font-normal normal-case tracking-normal',
                      'text-white placeholder-slate-500',
                      'focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400',
                      isGamesPageActive ? 'border-cyan-400/50' : 'border-slate-700/50',
                      'min-w-[400px] max-w-[500px]',
                    ].join(' ')}
                  />
                </div>
              </div>

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

                    {/* active underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Invites (bell icon) */}
          <div className="flex h-full items-center border-l border-slate-800">
            <Link
              href="/invites"
              className={[
                'relative flex h-full items-center justify-center px-6',
                pathname === '/invites' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              <div className="relative">
                <Notifications sx={{ fontSize: 20 }} />
                {typeof pendingInvitesCount === 'number' &&
                  pendingInvitesCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-orange-500 rounded-full border-2 border-slate-900" />
                  )}
              </div>
              {/* active underline */}
              {pathname === '/invites' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400" />
              )}
            </Link>
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
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.username || 'User'}
                    username={profile.username}
                    size="sm"
                    showBorder
                    borderColor={profile.plan_tier === 'founder' ? 'founder' : 
                      (profile.plan_tier === 'pro' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ? 'pro' : 'default'}
                  />

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
                          <Avatar
                            src={profile.avatar_url}
                            alt={profile.username || 'User'}
                            username={profile.username}
                            size="lg"
                            showBorder
                            borderColor={profile.plan_tier === 'founder' ? 'founder' : 
                              (profile.plan_tier === 'pro' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) ? 'pro' : 'default'}
                            className="flex-shrink-0"
                          />

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
    </>
  )
}

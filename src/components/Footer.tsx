'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function Footer() {
  const pathname = usePathname()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const startYear = 2024
  const [sidebarWidth, setSidebarWidth] = useState('18rem') // Default w-72
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    // Check if we're on a large screen
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    // Get initial width from CSS variable or localStorage
    const updateWidth = () => {
      const width = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width')
        .trim()
      if (width) {
        setSidebarWidth(width)
      } else {
        // Fallback: check localStorage
        const isCompact = localStorage.getItem('sidebar_compact')
        setSidebarWidth(isCompact === 'true' ? '4rem' : '18rem')
      }
    }

    updateWidth()

    // Listen for changes to the CSS variable
    const observer = new MutationObserver(updateWidth)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    // Poll for changes (fallback)
    const interval = setInterval(updateWidth, 100)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', checkScreenSize)
      clearInterval(interval)
    }
  }, [])

  // Hide footer on auth pages, settings page, and onboarding (after all hooks are declared)
  if (pathname?.startsWith('/auth/') || pathname === '/settings' || pathname === '/onboarding') {
    return null
  }

  // Don't apply sidebar margin on "is this game alive" pages (sidebar is hidden)
  const isGameAlivePage = pathname?.startsWith('/is-')

  return (
    <footer 
      className="hidden lg:block bg-slate-900 transition-all duration-300"
      style={{ marginLeft: isGameAlivePage || !isLargeScreen ? '0' : sidebarWidth }}
    >
      {/* Separator on top */}
      <div className="border-t border-slate-700/50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content - Grid Layout */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          {/* Column 1: General */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">General</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmap"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Roadmap
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/billing"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Billing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Communities */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Communities</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/events"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/tournaments"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Tournaments
                </Link>
              </li>
              <li>
                <Link
                  href="/games"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Browse Games
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@apoxer.com"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Email
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/3CRbvPw3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Games + Social Icons */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Games</h3>
            <ul className="space-y-3 mb-6">
              <li>
                <Link
                  href="/is-joey-the-passion-still-active"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Joey the Passion
                </Link>
              </li>
              <li>
                <Link
                  href="/is-doom-still-active"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Doom
                </Link>
              </li>
              <li>
                <Link
                  href="/is-wolfenstein-still-active"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Wolfenstein
                </Link>
              </li>
              <li>
                <Link
                  href="/is-quake-still-active"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Quake
                </Link>
              </li>
              <li>
                <Link
                  href="/is-counter-strike-source-still-active"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Counter Strike Source
                </Link>
              </li>
            </ul>
            
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://discord.gg/3CRbvPw3"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Discord"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com/apoxer"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com/apoxer"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-slate-700/50 mb-8"></div>

        {/* Bottom Section - Copyright */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-app-green-400 font-title text-lg font-bold">APOXER</span>
            <span className="text-slate-400 text-sm">
              © {startYear} - {currentYear} APOXER
            </span>
          </div>
          {user && (
            <Link
              href="/billing"
              className="text-yellow-400 text-sm font-title hover:text-yellow-300 transition-colors"
            >
              Upgrade to Apex
            </Link>
          )}
        </div>
      </div>
    </footer>
  )
}

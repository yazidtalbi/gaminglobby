'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="relative z-50 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-sm bg-gradient-to-br from-cyan-400 to-cyan-600" />
              <span className="text-xl font-title font-bold text-white">APOXER</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/games"
              className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
            >
              Games
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
            >
              FAQ
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold"
            >
              <Link href="/auth/signup">Get Early Access</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-4">
            <Link
              href="#features"
              className="block text-sm font-medium text-slate-300 hover:text-cyan-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block text-sm font-medium text-slate-300 hover:text-cyan-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/games"
              className="block text-sm font-medium text-slate-300 hover:text-cyan-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Games
            </Link>
            <Link
              href="#faq"
              className="block text-sm font-medium text-slate-300 hover:text-cyan-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <div className="pt-4 space-y-3 border-t border-slate-800">
              <Button
                asChild
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold"
              >
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  Get Early Access
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-cyan-400 to-cyan-600" />
            <span className="text-xl font-bold text-white">APOXER</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              How it works
            </a>
            <Link
              href="/blog"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors"
            >
              Get Started Free
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link
              href="/auth/register"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

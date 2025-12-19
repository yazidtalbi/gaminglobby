import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-6 w-6 rounded-sm bg-gradient-to-br from-cyan-400 to-cyan-600" />
              <span className="text-xl font-title font-bold text-white">APOXER</span>
            </div>
            <p className="text-sm text-slate-400 mb-6 max-w-md">
              Preserving communities, not just games.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/games" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Browse Games
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-6">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-slate-800 text-center text-xs lg:text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Apoxer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

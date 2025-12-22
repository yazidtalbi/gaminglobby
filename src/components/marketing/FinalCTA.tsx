// /src/components/marketing/FinalCTA.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage } from '@/lib/landing-images'

export function FinalCTA() {
  const ctaImage = getLandingImage('final-cta')

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background image */}
      <SectionImage
        src={ctaImage.src}
        alt={ctaImage.alt}
        variant="blur-bg"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 via-purple-900/20 to-pink-900/30 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />

      {/* Radial glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Your next squad is already playing.
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-200">
            Join thousands of players who&apos;ve already found their perfect teammates. Get started in less than a minute.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-semibold text-white hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25"
            >
              Get Started Free
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white hover:bg-white/20 transition-colors"
            >
              See How It Works
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free forever plan
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

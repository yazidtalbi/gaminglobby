// /src/components/marketing/Hero.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage } from '@/lib/landing-images'
import { YouTubeBackground } from '@/components/marketing/YouTubeBackground'

export function Hero() {
  const heroImage = getLandingImage('hero')

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20 lg:py-32">
      {/* YouTube video background */}
      <YouTubeBackground
        videoId="9DM7NsxOS0Q"
        startTime={30}
        endTime={90}
      />
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left: Content */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Stop playing with randoms. Find teammates who fit your style.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
              Apoxer is a modern LFG and gaming matchmaking platform for 50,000+ games. Create or join active lobbies in seconds, chat in real time, and start playing with people who actually want the same experience.
            </p>

            {/* Primary CTA */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/auth/register"
                className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-semibold text-white hover:bg-cyan-600 transition-colors text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Microtrust */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free to start
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Takes less than 1 minute
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Works on desktop + mobile
              </span>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative">
            {/* Mobile: Show below headline */}
            <div className="lg:hidden mt-8">
              <SectionImage
                src={heroImage.src}
                alt={heroImage.alt}
                variant="hero"
                priority
                glowColor="cyan"
              />
            </div>
            
            {/* Desktop: Right side */}
            <div className="hidden lg:block">
              <SectionImage
                src={heroImage.src}
                alt={heroImage.alt}
                variant="hero"
                priority
                glowColor="cyan"
                containerClassName="aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

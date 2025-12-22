// /src/components/marketing/ProblemSolution.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage } from '@/lib/landing-images'

export function ProblemSolution() {
  const teammatesImage = getLandingImage('teammates')

  return (
    <section className="py-16 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Finding good teammates shouldn&apos;t be the hardest part of gaming.
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Most LFG tools are outdated, fragmented, or require you to jump through hoops. Apoxer gives you modern matchmaking that actually works—whether you&apos;re playing the latest AAA title or a hidden indie gem.
          </p>
        </div>

        {/* Wide banner image */}
        <div className="mt-12 mx-auto max-w-4xl">
          <SectionImage
            src={teammatesImage.src}
            alt={teammatesImage.alt}
            variant="wide"
            glowColor="violet"
          />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/auth/register"
            className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-semibold text-white hover:bg-cyan-600 transition-colors inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  )
}

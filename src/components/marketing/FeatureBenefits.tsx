// /src/components/marketing/FeatureBenefits.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage, type LandingImageKey } from '@/lib/landing-images'

const features: Array<{
  title: string
  description: string
  imageKey?: LandingImageKey
}> = [
  {
    title: '50,000+ games supported',
    description: 'From the latest AAA releases to indie gems and classic titles. If it has multiplayer, we support it.',
    imageKey: 'feature-games',
  },
  {
    title: 'Real-time chat',
    description: 'Communicate instantly with your potential teammates before jumping into a game together.',
    imageKey: 'feature-chat',
  },
  {
    title: 'Smart matching',
    description: 'Our system learns your preferences and helps you find players who actually fit your play style.',
    imageKey: 'feature-matchmaking',
  },
  {
    title: 'Platform agnostic',
    description: 'Find teammates regardless of whether you play on PC, console, or mobile.',
    imageKey: 'feature-filters',
  },
  {
    title: 'Active lobbies only',
    description: 'Lobbies automatically expire, so you only see players who are ready to play right now.',
  },
  {
    title: 'Free to start',
    description: 'All core features are free. Upgrade to Pro when you want priority placement and advanced features.',
  },
]

export function FeatureBenefits() {
  return (
    <section id="features" className="py-16 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to squad up faster
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Built for gamers, by gamers. No fluff, just features that matter.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => {
            const featureImage = feature.imageKey ? getLandingImage(feature.imageKey) : null

            return (
              <div 
                key={feature.title} 
                className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Feature image header */}
                {featureImage && (
                  <div className="relative">
                    <SectionImage
                      src={featureImage.src}
                      alt={featureImage.alt}
                      variant="mini"
                      glowColor="indigo"
                      containerClassName="border-0 rounded-none shadow-none ring-0"
                    />
                  </div>
                )}

                {/* Feature content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
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

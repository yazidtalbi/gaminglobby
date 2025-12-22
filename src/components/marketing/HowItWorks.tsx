// /src/components/marketing/HowItWorks.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage, type LandingImageKey } from '@/lib/landing-images'

const steps: Array<{
  number: string
  title: string
  description: string
  imageKey: LandingImageKey
}> = [
  {
    number: '1',
    title: 'Create or browse lobbies',
    description: 'Find active lobbies for your game or create your own with your preferences. Set platform, region, play style, and more.',
    imageKey: 'step-create-lobby',
  },
  {
    number: '2',
    title: 'Match with compatible players',
    description: 'Our system helps you find players who match your skill level, play style, and schedule. No more bad matches.',
    imageKey: 'step-match',
  },
  {
    number: '3',
    title: 'Chat and start playing',
    description: 'Communicate in real-time, share details, and jump into your game together. Simple, fast, effective.',
    imageKey: 'step-chat',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How Apoxer works
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Three simple steps to find your perfect squad.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, index) => {
              const stepImage = getLandingImage(step.imageKey)
              const isEven = index % 2 === 0

              return (
                <div key={step.number} className="relative">
                  {/* Connector line (desktop only) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute left-1/2 top-full h-16 lg:h-24 w-0.5 bg-gradient-to-b from-cyan-500/50 to-slate-800 -translate-x-1/2" />
                  )}

                  <div className={`grid gap-8 lg:grid-cols-2 lg:gap-12 items-center ${isEven ? '' : 'lg:grid-flow-dense'}`}>
                    {/* Text content */}
                    <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-2xl font-bold text-cyan-400 border border-cyan-500/30">
                          {step.number}
                        </div>
                        <div className="flex-1 pt-2">
                          <h3 className="text-xl font-semibold text-white lg:text-2xl">{step.title}</h3>
                          <p className="mt-3 text-slate-300 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Image */}
                    <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                      <SectionImage
                        src={stepImage.src}
                        alt={stepImage.alt}
                        variant="card"
                        badge={stepImage.badge}
                        glowColor="cyan"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
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

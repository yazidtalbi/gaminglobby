// /src/components/marketing/Pricing.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage, type LandingImageKey } from '@/lib/landing-images'

const plans: Array<{
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlight: boolean
  imageKey: LandingImageKey
}> = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      'Create and join unlimited lobbies',
      'Real-time chat',
      'Browse 50,000+ games',
      'Follow players & build your network',
      'Participate in community events',
    ],
    cta: 'Get Started Free',
    highlight: false,
    imageKey: 'pricing-free',
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/month',
    description: 'For serious players',
    features: [
      'Everything in Free',
      'Auto-invite: fill lobbies instantly',
      'Create & manage your own events',
      'Custom profile banners',
      'Pro badge on your profile',
      'Collections (coming soon)',
      'Early access to new features',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
    imageKey: 'pricing-pro',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-16 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Free to start. Upgrade when you want more power.
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Start free forever, or upgrade to Pro for the best experience.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none">
          {plans.map((plan) => {
            const planImage = getLandingImage(plan.imageKey)

            return (
              <div
                key={plan.name}
                className={`rounded-2xl border overflow-hidden ${
                  plan.highlight
                    ? 'border-cyan-500 bg-slate-900/50 ring-2 ring-cyan-500/20'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                {/* Plan image */}
                <div className="relative">
                  <SectionImage
                    src={planImage.src}
                    alt={planImage.alt}
                    variant="card"
                    badge={planImage.badge}
                    glowColor={plan.highlight ? 'cyan' : 'indigo'}
                    containerClassName="border-0 rounded-none shadow-none ring-0"
                  />
                </div>

                {/* Plan content */}
                <div className="p-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-slate-400">{plan.period}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                  </div>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-cyan-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href={plan.name === 'Free' ? '/auth/register' : '/billing'}
                      className={`block w-full rounded-full px-6 py-3 text-center font-semibold transition-colors ${
                        plan.highlight
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                          : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

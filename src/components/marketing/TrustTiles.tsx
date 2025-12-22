// /src/components/marketing/TrustTiles.tsx
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage } from '@/lib/landing-images'

const trustItems = [
  {
    stat: '50,000+',
    label: 'Games supported',
  },
  {
    stat: '100K+',
    label: 'Active players',
  },
  {
    stat: '< 1 min',
    label: 'Sign up time',
  },
  {
    stat: 'Free',
    label: 'To start',
  },
]

export function TrustTiles() {
  const statsBg = getLandingImage('stats-bg')

  return (
    <section className="relative py-20 bg-slate-950 overflow-hidden">
      {/* Blurred background image */}
      <SectionImage
        src={statsBg.src}
        alt={statsBg.alt}
        variant="blur-bg"
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {trustItems.map((item) => (
            <div 
              key={item.label} 
              className="text-center p-6 rounded-xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/50"
            >
              <div className="text-3xl font-bold text-cyan-400 sm:text-4xl lg:text-5xl">
                {item.stat}
              </div>
              <div className="mt-2 text-sm text-slate-300 font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

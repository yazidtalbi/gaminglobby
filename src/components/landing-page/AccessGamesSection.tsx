import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type OrbitItem = {
  title: string
  img: string
  // absolute positioning (responsive via clamp)
  style: React.CSSProperties
  size: { w: number; h: number }
}

const orbitItems: OrbitItem[] = [
  {
    title: 'FIFA 22',
    img: '/placeholders/games/fifa22.jpg',
    size: { w: 120, h: 56 },
    style: { top: 'clamp(12px, 3vw, 18px)', left: '50%', transform: 'translateX(-50%)' },
  },
  {
    title: 'Forza Horizon 5',
    img: '/placeholders/games/forza.jpg',
    size: { w: 300, h: 168 },
    style: { top: 'clamp(42px, 5vw, 64px)', right: 'clamp(18px, 3vw, 44px)' },
  },
  {
    title: 'Valorant',
    img: '/placeholders/games/valorant.jpg',
    size: { w: 160, h: 72 },
    style: { top: 'clamp(92px, 10vw, 130px)', left: 'clamp(22px, 10vw, 260px)' },
  },
  {
    title: 'Rocket League S2',
    img: '/placeholders/games/rocketleague.jpg',
    size: { w: 170, h: 88 },
    style: { top: 'clamp(150px, 18vw, 220px)', left: 'clamp(14px, 2.5vw, 30px)' },
  },
  {
    title: 'CS:GO',
    img: '/placeholders/games/csgo.jpg',
    size: { w: 360, h: 160 },
    style: { bottom: 'clamp(84px, 10vw, 140px)', left: 'clamp(18px, 3vw, 44px)' },
  },
  {
    title: 'Battlefront',
    img: '/placeholders/games/battlefront.jpg',
    size: { w: 260, h: 118 },
    style: { bottom: 'clamp(90px, 10vw, 140px)', right: 'clamp(18px, 3vw, 44px)' },
  },
  {
    title: 'Fortnite',
    img: '/placeholders/games/fortnite.jpg',
    size: { w: 210, h: 104 },
    style: { top: '50%', right: 'clamp(18px, 3vw, 44px)', transform: 'translateY(-10%)' },
  },
  {
    title: 'Bottom tiny',
    img: '/placeholders/games/random.jpg',
    size: { w: 120, h: 56 },
    style: { bottom: 'clamp(18px, 3vw, 24px)', left: '50%', transform: 'translateX(-50%)' },
  },
]

export function AccessGamesSection() {
  return (
    <section className="relative w-full overflow-hidden bg-black py-12 lg:py-16">
      {/* Outer vignette + subtle noise-like gradient */}
      <div className="pointer-events-none absolute inset-0">
        {/* soft center bloom */}
        <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.18)_0%,rgba(168,85,247,0.10)_25%,rgba(0,0,0,0)_62%)] blur-[2px]" />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.6)_55%,rgba(0,0,0,0.92)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="relative mx-auto flex min-h-[520px] w-full items-center justify-center">
          {/* Rings */}
          <Rings />

          {/* Center content */}
          <div className="relative z-10 flex max-w-[560px] flex-col items-center text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Access Games Instantly
            </h2>
            <p className="mt-4 max-w-[46ch] text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
              With nearly 30,000 games from AAA to indie and everything in-between. Enjoy exclusive deals,
              automatic game updates, and other great perks.
            </p>

            <Button
              className="mt-8 h-11 rounded-full px-6 text-sm font-medium bg-slate-900/50 hover:bg-slate-800/50 border border-white/10"
              variant="default"
              asChild
            >
              <Link href="/games">
                <span className="bg-gradient-to-r from-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
                  Browse the Store
                </span>
                <span className="ml-2 text-white/80">→</span>
              </Link>
            </Button>
          </div>

          {/* Orbit items */}
          <div className="pointer-events-none absolute inset-0 z-20">
            {orbitItems.map((item) => (
              <OrbitCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Rings() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      <div className="relative h-[520px] w-[520px] sm:h-[640px] sm:w-[640px]">
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border border-white/20" />
        
        {/* Middle circle */}
        <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
        
        {/* Inner circle */}
        <div className="absolute left-1/2 top-1/2 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
        
        {/* Additional inner circles for depth */}
        <div className="absolute left-1/2 top-1/2 h-[35%] w-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
        <div className="absolute left-1/2 top-1/2 h-[20%] w-[20%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      </div>
    </div>
  )
}

function OrbitCard({ item }: { item: OrbitItem }) {
  return (
    <div
      className="absolute select-none"
      style={item.style}
      aria-hidden="true"
    >
      <div
        className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ width: item.size.w, height: item.size.h }}
      >
        {/* image */}
        <Image
          src={item.img}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 200px, 320px"
          priority={false}
        />
        {/* subtle gloss */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_55%)]" />
      </div>
    </div>
  )
}

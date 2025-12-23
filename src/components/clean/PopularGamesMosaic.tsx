import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

interface GameCover {
  name: string
  url: string | null
  thumb: string | null
}

interface PopularGamesMosaicProps {
  games: GameCover[]
}

export function PopularGamesMosaic({ games }: PopularGamesMosaicProps) {
  return (
    <div className="grid grid-cols-3  w-full max-w-[420px]">
      {/* Row 1 */}
      <div className="aspect-square overflow-hidden rounded-xl">
        {games[0]?.thumb || games[0]?.url ? (
          <img
            src={(games[0].thumb || games[0].url) as string}
            alt={games[0].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white/80 text-center px-2">{games[0]?.name || 'Game'}</span>
          </div>
        )}
      </div>
      <div className="aspect-square rounded-br-3xl bg-violet-500 flex flex-col justify-center items-center px-3">
        <span className="text-base font-bold leading-tight text-white">Joey</span>
        <span className="text-base font-bold leading-tight text-white">The Passion</span>
      </div>
      <div className="aspect-square overflow-hidden rounded-tl-3xl">
        {games[1]?.thumb || games[1]?.url ? (
          <img
                  src="https://c.tenor.com/brA0lLYRcI0AAAAd/tenor.gif"
            alt={games[1].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white/80 text-center px-2">{games[1]?.name || 'Game'}</span>
          </div>
        )}
      </div>

      {/* Row 2 */}
      <div className="aspect-square rounded-full bg-yellow-400 flex flex-col justify-center items-center px-3 overflow-hidden">
        <span className="text-base font-bold leading-tight text-slate-900">Call of</span>
        <span className="text-base font-bold leading-tight text-slate-900">Duty</span>
      </div>
      <div className="aspect-square overflow-hidden rounded-tr-3xl">
        {games[2]?.thumb || games[2]?.url ? (
          <img
            src={(games[2].thumb || games[2].url) as string}
            alt={games[2].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white/80 text-center px-2">{games[2]?.name || 'Game'}</span>
          </div>
        )}
      </div>
      <div className="aspect-square rounded-xl bg-yellow-400 flex flex-col justify-center items-center px-3 rounded-tr-3xl overflow-hidden">
        <span className="text-base font-bold leading-tight text-slate-900">Battlefield</span>
      </div>

      {/* Row 3 */}
      <div className="aspect-square overflow-hidden rounded-xl">
        {games[3]?.thumb || games[3]?.url ? (
          <img
      src="https://cdn2.steamgriddb.com/thumb/3133fea47a2c8ad04a3a26bbc1de0c58.jpg"
            alt={games[3].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white/80 text-center px-2">{games[3]?.name || 'Game'}</span>
          </div>
        )}
      </div>
      <div className="aspect-square rounded-full bg-slate-900 flex flex-col justify-center items-center px-3">
        <span className="text-sm font-bold leading-tight text-white">Arc</span>
        <span className="text-sm font-bold leading-tight text-white">Raiders</span>
      </div>
      <div className="aspect-square overflow-hidden rounded-xl">
        {games[5]?.thumb || games[5]?.url ? (
          <img
            src="https://media1.tenor.com/m/xacFCPcUL44AAAAd/arc-raiders.gif"
            alt={games[5].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white/80 text-center px-2">{games[5]?.name || 'Game'}</span>
          </div>
        )}
      </div>

      {/* Row 4 */}
      <Link
        href="/games"
        className="aspect-square rounded-xl bg-slate-100 flex flex-col justify-center px-3 hover:opacity-90 transition-opacity"
      >
        <ArrowUpRight className="w-5 h-5 mb-1.5 text-slate-900" />
        <span className="text-sm font-bold leading-tight text-slate-900">More</span>
        <span className="text-sm font-bold leading-tight text-slate-900">Popular</span>
        <span className="text-sm font-bold leading-tight text-slate-900">Games</span>
      </Link>
      <div className="aspect-square overflow-hidden rounded-xl">
        {games[4]?.thumb || games[4]?.url ? (
          <img
            src="https://cdn2.steamgriddb.com/thumb/9ea87639738315d03eddf766727aaf18.jpg"
            alt={games[4].name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center">
            <span className="text-xs font-medium text-white/80 text-center px-2">{games[4]?.name || 'Game'}</span>
          </div>
        )}
      </div>
      <div className="aspect-square rounded-xl bg-slate-100 flex flex-col justify-center items-center px-3">
        <span className="text-base font-bold leading-tight text-slate-900">BLUR</span>
      </div>
    </div>
  )
}

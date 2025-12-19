import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

const newsItems = [
  {
    title: 'THE BEST MATCHMAKING STRATEGIES IN 2024',
    category: 'Guide',
    date: '2 days ago',
    slug: 'best-matchmaking-strategies-2024',
  },
  {
    title: 'HOW TO FIND PLAYERS FOR OLDER GAMES',
    category: 'Tips',
    date: '5 days ago',
    slug: 'find-players-older-games',
  },
  {
    title: 'BUILDING GAMING COMMUNITIES ON APOXER',
    category: 'Community',
    date: '1 week ago',
    slug: 'building-gaming-communities',
  },
]

export function LatestNews() {
  return (
    <section className="relative z-10 py-12 lg:py-16 bg-slate-900/30">
      <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-12 text-center">
          LATEST NEWS FROM GAMING COMMUNITY
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {newsItems.map((item, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all cursor-pointer group"
            >
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-lg" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{item.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <Link
                    href={`/blog/${item.slug}`}
                    className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Read More
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

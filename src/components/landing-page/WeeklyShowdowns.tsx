import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const weeklyShowdowns = [
  {
    game: 'FORTNITE',
    schedule: 'Every Friday at 7 PM',
    description: 'Join weekly battle royale matches',
    slug: 'fortnite',
  },
  {
    game: 'FC 2025',
    schedule: 'Every Saturday at 6 PM',
    description: 'Weekly football tournaments',
    slug: 'fc-2025',
  },
  {
    game: 'UFC 5',
    schedule: 'Every Sunday at 8 PM',
    description: 'Fight night championships',
    slug: 'ufc-5',
  },
]

export function WeeklyShowdowns() {
  return (
    <section className="relative z-10 py-8 lg:py-12 bg-slate-900/30">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header with [ BLOG ] on left and description on right */}
        <div className="grid lg:grid-cols-[160px_1fr] gap-6 lg:gap-8 mb-6 lg:mb-8">
          <div className="text-left">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              [ BLOG ]
            </div>
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-title font-bold text-white leading-tight">
              WE OFFER AN EXCITING LINEUP OF MATCHES AND TOURNAMENTS FOR GAMERS OF ALL SKILL LEVELS.
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {weeklyShowdowns.map((showdown, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all"
            >
              <CardContent className="p-6 lg:p-8">
                <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-4 lg:mb-6">
                  WEEKLY SHOWDOWN
                </div>
                <h3 className="text-lg lg:text-xl font-title font-bold text-white mb-4 lg:mb-6">
                  {showdown.game}
                </h3>
                <div className="text-sm lg:text-base text-slate-300 mb-4 lg:mb-6">
                  {showdown.schedule}
                </div>
                <p className="text-xs lg:text-sm text-slate-400 mb-6 lg:mb-8">
                  {showdown.description}
                </p>
                <div className="flex items-center justify-between">
                  <Button
                    asChild
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Link href={`/games/${showdown.slug}`}>
                      Join Now
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="relative z-10 py-20 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-6xl font-title font-bold text-white mb-6">
          Ready to find players?
        </h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Join Apoxer today and discover a better way to find teammates, join lobbies, and connect with gaming communities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-title font-semibold text-base px-8"
          >
            <Link href="/games">
              Browse Games
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 font-title text-base px-8"
          >
            <Link href="/auth/signup">
              <Plus className="mr-2 w-5 h-5" />
              Create a Lobby
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

import { Button } from '@/components/ui/button'

export function CommunityCTA() {
  return (
    <section className="relative z-10 py-12 lg:py-20 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50" />
      <div className="relative mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="text-center">
          <h2 className="text-2xl lg:text-4xl font-title font-bold text-white mb-6 lg:mb-8 leading-tight">
            FIND GAMER FRIENDS AND BECOME A PART OF OUR COMMUNITY!
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 lg:mb-12">
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white px-10 py-6 h-auto text-base"
            >
              Download on the App Store
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white px-10 py-6 h-auto text-base"
            >
              Get it on Google Play
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

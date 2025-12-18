import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/Avatar'

const testimonials = [
  {
    name: 'Alex',
    game: 'Battlefield 3',
    text: 'Finally found people still playing BF3. The lobby system is so much faster than hunting through Discord servers.',
    region: 'EU',
  },
  {
    name: 'Sam',
    game: 'Team Fortress 2',
    text: 'Love how you can see player tags and what people are looking for. Makes finding the right teammates way easier.',
    region: 'NA',
  },
  {
    name: 'Jordan',
    game: 'Counter-Strike 2',
    text: 'The short-lived lobbies are perfect. No more dead servers or waiting forever. People are actually ready to play.',
    region: 'OCE',
  },
]

export function Testimonials() {
  return (
    <section className="relative z-10 py-20 lg:py-32 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            What players are saying
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50"
            >
              <CardContent className="p-6">
                <p className="text-slate-300 mb-4 leading-relaxed">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={null}
                    alt={testimonial.name}
                    username={testimonial.name}
                    size="sm"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">
                      {testimonial.game} • {testimonial.region}
                    </div>
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

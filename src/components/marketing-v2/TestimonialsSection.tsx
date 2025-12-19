import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

const testimonials = [
  {
    rating: 5,
    text: 'Finally found people still playing BF3. The lobby system is so much faster than hunting through Discord servers.',
    name: 'Alex',
    date: '2 days ago',
    username: 'alex_gamer',
  },
  {
    rating: 5,
    text: 'Love how you can see player tags and what people are looking for. Makes finding the right teammates way easier.',
    name: 'Sam',
    date: '5 days ago',
    username: 'sam_plays',
  },
  {
    rating: 5,
    text: 'The short-lived lobbies are perfect. No more dead servers or waiting forever. People are actually ready to play.',
    name: 'Jordan',
    date: '1 week ago',
    username: 'jordan_lfg',
  },
]

export function TestimonialsSection() {
  return (
    <section className="relative z-10 py-16 lg:py-24 bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Trustpilot Rating */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-green-400 fill-green-400"
                />
              ))}
            </div>
            <div className="text-2xl font-bold text-white mb-2">Excellent</div>
            <p className="text-slate-300 mb-6 max-w-md">
              Discover real feedback and stories from our community. Your trust, our commitment.
            </p>
            <div className="flex gap-4">
              {['Facebook', 'Twitter', 'Discord', 'YouTube'].map((social) => (
                <div
                  key={social}
                  className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-cyan-500/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs text-slate-400">{social[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Testimonials Carousel */}
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-slate-800 bg-slate-900/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4 leading-relaxed">
                    &quot;{testimonial.text}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={null}
                      alt={testimonial.name}
                      username={testimonial.username}
                      size="sm"
                    />
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {testimonial.date}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// /src/components/marketing/ResourcesPreview.tsx
import Link from 'next/link'
import { SectionImage } from '@/components/landing/section-image'
import { getLandingImage, type LandingImageKey } from '@/lib/landing-images'

const blogPosts: Array<{
  title: string
  description: string
  slug: string
  imageKey: LandingImageKey
}> = [
  {
    title: 'How to Find Teammates for Competitive Gaming',
    description: 'Learn the best strategies for finding reliable teammates who match your play style and goals.',
    slug: 'how-to-find-teammates-competitive-gaming',
    imageKey: 'blog-1',
  },
  {
    title: 'Top 10 Games to Play with Friends in 2024',
    description: 'Discover the best multiplayer games to enjoy with your squad, from co-op adventures to competitive shooters.',
    slug: 'top-10-games-play-with-friends-2024',
    imageKey: 'blog-2',
  },
  {
    title: 'Matchmaking Tips: Getting the Most Out of Apoxer',
    description: 'Expert tips on creating effective lobbies, setting the right preferences, and finding your ideal teammates faster.',
    slug: 'matchmaking-tips-getting-most-out-of-apoxer',
    imageKey: 'blog-3',
  },
  {
    title: 'Community Spotlight: Success Stories from Apoxer Players',
    description: 'Read how players have found long-term gaming friends and built successful teams through Apoxer.',
    slug: 'community-spotlight-success-stories-apoxer-players',
    imageKey: 'blog-4',
  },
]

export function ResourcesPreview() {
  return (
    <section className="py-16 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Guides, matchmaking tips & community news
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Learn from the community and stay updated with the latest gaming matchmaking strategies.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none">
          {blogPosts.map((post) => {
            const postImage = getLandingImage(post.imageKey)

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border border-slate-800 bg-slate-950 overflow-hidden hover:border-cyan-500/50 transition-colors"
              >
                {/* Blog card image */}
                <SectionImage
                  src={postImage.src}
                  alt={postImage.alt}
                  variant="card"
                  glowColor="purple"
                  containerClassName="border-0 rounded-none shadow-none ring-0"
                />

                {/* Blog content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-slate-300 text-sm line-clamp-2">{post.description}</p>
                  <div className="mt-4 flex items-center text-sm text-cyan-400 group-hover:text-cyan-300">
                    Read more
                    <svg
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            View all articles
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

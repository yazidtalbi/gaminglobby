import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog/posts'
import { siteUrl } from '@/lib/seo/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateWebSiteJsonLd } from '@/lib/seo/jsonld'

export const metadata: Metadata = {
  title: 'Blog - Find Players & Discover Active Multiplayer Games',
  description: 'Evergreen guides on finding players for multiplayer games, discovering active communities, and preserving gaming communities. Learn which games are still active and how to connect with players.',
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'Blog - Find Players & Discover Active Multiplayer Games',
    description: 'Evergreen guides on finding players for multiplayer games, discovering active communities, and preserving gaming communities.',
    url: `${siteUrl}/blog`,
    siteName: 'Apoxer.com',
    type: 'website',
  },
  twitter: {
    title: 'Blog - Find Players & Discover Active Multiplayer Games',
    description: 'Evergreen guides on finding players for multiplayer games, discovering active communities, and preserving gaming communities.',
    card: 'summary_large_image',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <>
      <JsonLd data={generateWebSiteJsonLd()} />
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl font-title font-bold mb-4">
                Blog
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl">
                Evergreen guides on finding players, discovering active communities, and preserving multiplayer gaming communities.
              </p>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => (
                  <article
                    key={post.slug}
                    className="border-b border-slate-800 pb-8 last:border-b-0 last:pb-0"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group block"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h2 className="text-2xl sm:text-3xl font-title font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {post.title}
                        </h2>
                        <span className="text-xs text-slate-500 whitespace-nowrap mt-1">
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 mb-3 line-clamp-2">
                        {post.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <span className="px-2 py-1 bg-slate-800 text-cyan-400 rounded border border-slate-700">
                          {post.category}
                        </span>
                        {post.relatedGames && post.relatedGames.length > 0 && (
                          <span className="text-slate-500">
                            {post.relatedGames.length} related game{post.relatedGames.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


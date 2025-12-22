import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog/posts'
import { siteUrl } from '@/lib/seo/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateArticleJsonLd } from '@/lib/seo/article'
import ReactMarkdown from 'react-markdown'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const url = `${siteUrl}/blog/${slug}`

  return {
    title: `${post.title} - Apoxer Blog`,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: 'Apoxer.com',
      type: 'article',
      publishedTime: post.publishedAt,
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
    },
    twitter: {
      title: post.title,
      description: post.description,
      card: 'summary_large_image',
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const url = `${siteUrl}/blog/${slug}`
  const articleJsonLd = generateArticleJsonLd({
    title: post.title,
    description: post.description,
    url,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  })

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8 text-sm"
            >
              ← Back to Blog
            </Link>

            {/* Article Header */}
            <header className="mb-8">
              <div className="mb-4">
                <span className="px-3 py-1 bg-slate-800 text-cyan-400 rounded border border-slate-700 text-sm">
                  {post.category}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-title font-bold mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {post.updatedAt && (
                  <>
                    <span>•</span>
                    <time dateTime={post.updatedAt}>
                      Updated {new Date(post.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </>
                )}
              </div>
            </header>

            {/* Article Content */}
            <article className="prose prose-invert prose-lg max-w-none mb-12">
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-3xl sm:text-4xl font-title font-bold mt-8 mb-4 text-white" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-2xl sm:text-3xl font-title font-bold mt-8 mb-4 text-white" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xl sm:text-2xl font-title font-semibold mt-6 mb-3 text-white" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-slate-300 mb-4 leading-relaxed" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside mb-4 space-y-2 text-slate-300" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-300" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="ml-4" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a className="text-cyan-400 hover:text-cyan-300 underline" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-white" {...props} />
                    ),
                    code: ({ node, ...props }) => (
                      <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 text-sm font-mono" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-400 my-4" {...props} />
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </article>

            {/* Related Games Section */}
            {post.relatedGames && post.relatedGames.length > 0 && (
              <div className="border-t border-slate-800 pt-8 mb-8">
                <h2 className="text-xl font-title font-semibold mb-4 text-white">
                  Related Games
                </h2>
                <div className="flex flex-wrap gap-2">
                  {post.relatedGames.map((gameName) => (
                    <Link
                      key={gameName}
                      href={`/games?q=${encodeURIComponent(gameName)}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700 text-sm transition-colors"
                    >
                      {gameName}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-slate-800 pt-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
                <h3 className="text-xl font-title font-semibold mb-2 text-white">
                  Find players for this game on Apoxer
                </h3>
                <p className="text-slate-400 mb-4">
                  Join active lobbies, connect with players, and keep the community alive.
                </p>
                <Link
                  href="/lobbies"
                  className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded transition-colors font-medium"
                >
                  Browse Active Lobbies →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


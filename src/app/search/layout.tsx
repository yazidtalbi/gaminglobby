import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Search Games - Find Games & Communities',
  description: 'Search for games, gaming communities, and players. Find any game from thousands of titles and discover active lobbies and communities on APOXER.COM.',
  path: '/search',
})

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

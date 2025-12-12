import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Explore Games & Communities',
  description: 'Browse thousands of games, active lobbies, and player communities on Apoxer.',
  path: '/games',
})

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

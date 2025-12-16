import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Browse Games & Communities - Gaming Matchmaking',
  description: 'Discover thousands of games, browse active gaming communities, find players, and join live lobbies. Search any game and connect with fellow gamers on APOXER.COM.',
  path: '/games',
})

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

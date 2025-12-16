import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Upcoming Gaming Events - Join Community Events',
  description: 'Discover and join upcoming gaming events, weekly community votes, and scheduled gaming sessions. Find players for your favorite games and participate in community-driven events on APOXER.COM.',
  path: '/events',
})

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

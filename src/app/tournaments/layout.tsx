import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Gaming Tournaments Directory - Competitive Tournaments',
  description: 'Browse and join competitive gaming tournaments. Create tournaments, manage brackets, compete for prizes, and track match results. Find tournaments for your favorite games on APOXER.COM.',
  path: '/tournaments',
})

export default function TournamentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

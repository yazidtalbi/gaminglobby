import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Product Features - Gaming Matchmaking Platform',
  description: 'Explore Apoxer features: game discovery, lobby system, player matchmaking, tournaments, events, and social features. Learn how to find players, join lobbies, and build your gaming community.',
  path: '/features',
})

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

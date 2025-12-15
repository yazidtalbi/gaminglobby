import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { AboutPageContent } from '@/components/AboutPageContent'

export const metadata: Metadata = {
  ...createMetadata({
    title: 'About — Apoxer',
    description: 'Apoxer is a lobby-first matchmaking platform that helps players find real people to play with, especially for niche, older, or less popular multiplayer games.',
    path: '/about',
  }),
}

export default function AboutPage() {
  return <AboutPageContent />
}

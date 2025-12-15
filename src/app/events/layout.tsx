import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Weekly Community Vote',
  description: 'Vote for the next weekly community game event on APOXER.COM.',
  path: '/events',
})

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

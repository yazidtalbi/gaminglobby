import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Create & join tournaments',
  description: 'Create and join gaming tournaments on APOXER.COM.',
  path: '/tournaments',
})

export default function TournamentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

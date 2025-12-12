import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Connect with players',
  description: 'Track your gaming network activity.',
  path: '/social',
})

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

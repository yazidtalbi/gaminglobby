import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Invites',
  description: 'View and manage your lobby invites on APOXER.COM.',
  path: '/invites',
})

export default function InvitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

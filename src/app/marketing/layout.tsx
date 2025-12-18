import type { Metadata } from 'next'
import './marketing.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.apoxer.com'),
  title: {
    template: '%s | Apoxer',
    default: 'Apoxer - Find Players, Join Lobbies, Discover Communities',
  },
  description: 'Find players for any game—fast. Join short-lived lobbies, discover game communities, and make fragmented multiplayer games visible again. No Discord hunting required.',
  openGraph: {
    type: 'website',
    siteName: 'Apoxer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Apoxer - Gaming Matchmaking Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apoxer - Find Players, Join Lobbies, Discover Communities',
    description: 'Find players for any game—fast. Join short-lived lobbies, discover game communities, and make fragmented multiplayer games visible again.',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="font-sans antialiased bg-slate-950 text-slate-100 marketing-layout">
      <div className="marketing-background">
        <div className="marketing-background-pattern" />
      </div>
      {children}
    </div>
  )
}

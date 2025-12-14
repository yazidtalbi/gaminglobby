import type { Metadata } from 'next'
import { Rubik, Rajdhani } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { BottomNavbar } from '@/components/BottomNavbar'
import { QuickMatchmakingBar } from '@/components/QuickMatchmakingBar'
import { Providers } from '@/components/Providers'
import { Sidebar } from '@/components/Sidebar'
import { MainContent } from '@/components/MainContent'
import { FloatingLobbyChat } from '@/components/FloatingLobbyChat'
import { Footer } from '@/components/Footer'
import { siteName, siteUrl, getDefaultRobots, twitterHandle } from '@/lib/seo/site'

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-rubik',
  display: 'swap',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | Apoxer',
    default: 'Apoxer.com - Discover, Match & Play Games with Friends | Gaming Lobbies & Communities',
  },
  description: 'Apoxer.com is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
  keywords: ['gaming', 'matchmaking', 'game lobbies', 'find players', 'gaming communities', 'multiplayer games', 'game matchmaking', 'online gaming', 'gaming platform'],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    type: 'website',
    siteName,
    url: siteUrl,
    title: 'Apoxer.com - Discover, Match & Play Games with Friends',
    description: 'Apoxer.com is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Apoxer - Gaming Matchmaking Platform',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apoxer.com - Discover, Match & Play Games with Friends',
    description: 'Apoxer.com is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
    images: [`${siteUrl}/og-image.png`],
    creator: twitterHandle || undefined,
  },
  robots: getDefaultRobots(),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${rubik.variable} ${rajdhani.variable}`}>
      <body className="font-sans antialiased bg-slate-900 text-slate-100">
        <Providers>
          <Navbar />
          <Sidebar />
          <MainContent>
            {children}
          </MainContent>
          <Footer />
          <FloatingLobbyChat />
          <QuickMatchmakingBar />
          <BottomNavbar />
        </Providers>
      </body>
    </html>
  )
}

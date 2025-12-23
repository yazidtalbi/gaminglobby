import type { Metadata } from 'next'
import Script from 'next/script'
import { Rubik, Rajdhani } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper'
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

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: '%s - APOXER.COM',
      default: 'APOXER.COM - Find Players, Join Lobbies, Discover Gaming Communities',
    },
    description: 'APOXER.COM is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
    keywords: ['gaming', 'matchmaking', 'game lobbies', 'find players', 'gaming communities', 'multiplayer games', 'game matchmaking', 'online gaming', 'gaming platform'],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    openGraph: {
      type: 'website',
      siteName,
      url: siteUrl,
      title: 'APOXER.COM - Find Players, Join Lobbies, Discover Gaming Communities',
      description: 'APOXER.COM is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
      images: [
        {
          url: `https://apoxer.com/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'APOXER.COM - Gaming Matchmaking Platform',
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'APOXER.COM - Find Players, Join Lobbies, Discover Gaming Communities',
      description: 'APOXER.COM is a gaming matchmaking platform intended for both game players and gaming communities. Find players, join live lobbies, discover games, and connect with thousands of gamers worldwide.',
      images: [`https://apoxer.com/og-image.png`],
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${rubik.variable} ${rajdhani.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APOXER" />
        <meta name="theme-color" content="#06b6d4" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-slate-900 text-slate-100">
        <Script
          src="https://t.contentsquare.net/uxa/2914e340b12cd.js"
          strategy="afterInteractive"
        />
        <Providers>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Rubik, Rajdhani } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/Providers'
import { Sidebar } from '@/components/Sidebar'
import { MainContent } from '@/components/MainContent'
import { FloatingLobbyChat } from '@/components/FloatingLobbyChat'
import { Footer } from '@/components/Footer'
import { siteName, siteUrl, getDefaultRobots } from '@/lib/seo/site'

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
    default: 'Apoxer | Gaming Matchmaking, Lobbies & Player Communities',
  },
  description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
  openGraph: {
    type: 'website',
    siteName,
    url: siteUrl,
    title: 'Apoxer',
    description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apoxer',
    description: 'Apoxer is a gaming matchmaking platform to find players, join live lobbies, and explore communities across thousands of games.',
    images: [`${siteUrl}/og-image.png`],
  },
  robots: getDefaultRobots(),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
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
        </Providers>
      </body>
    </html>
  )
}

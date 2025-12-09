import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/Providers'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'LobbyHub - Find Your Squad',
  description: 'Lobby-focused matchmaking app for games. Find players, join lobbies, and connect with gaming communities.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

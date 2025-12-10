import type { Metadata } from 'next'
import { Outfit, Rajdhani } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/Providers'
import { Sidebar } from '@/components/Sidebar'
import { MainContent } from '@/components/MainContent'
import { FloatingLobbyChat } from '@/components/FloatingLobbyChat'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
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
      <body className={`${outfit.variable} ${rajdhani.variable} font-sans antialiased bg-slate-900 text-slate-100`}>
        <Providers>
          <Navbar />
          <Sidebar />
          <MainContent>
            {children}
          </MainContent>
          <FloatingLobbyChat />
        </Providers>
      </body>
    </html>
  )
}

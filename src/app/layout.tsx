import type { Metadata } from 'next'
import { Rubik, Rajdhani } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/Providers'
import { Sidebar } from '@/components/Sidebar'
import { MainContent } from '@/components/MainContent'
import { FloatingLobbyChat } from '@/components/FloatingLobbyChat'
import { Footer } from '@/components/Footer'

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
  title: 'Apoxer - Find Your Squad',
  description: 'Lobby-focused matchmaking app for games. Find players, join lobbies, and connect with gaming communities.',
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

'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { MainContent } from '@/components/MainContent'
import { Footer } from '@/components/Footer'
import { FloatingLobbyChat } from '@/components/FloatingLobbyChat'
import { QuickMatchmakingBar } from '@/components/QuickMatchmakingBar'
import { BottomNavbar } from '@/components/BottomNavbar'

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show app layout components on marketing pages
  const isMarketingPage = pathname?.startsWith('/marketing') || pathname?.startsWith('/landing')
  
  if (isMarketingPage) {
    return <>{children}</>
  }
  
  return (
    <>
      <Navbar />
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
      <Footer />
      <FloatingLobbyChat />
      <QuickMatchmakingBar />
      <BottomNavbar />
    </>
  )
}

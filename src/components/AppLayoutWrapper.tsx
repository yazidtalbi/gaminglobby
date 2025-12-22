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
  const isMarketingPage = pathname === '/' || pathname?.startsWith('/marketing') || pathname?.startsWith('/landing') || pathname === '/apoxer' || pathname === '/clean'
  
  // Enable sidebar and navbar for /home
  const isHomePage = pathname === '/home'
  
  if (isMarketingPage) {
    return <>{children}</>
  }
  
  // /home should have sidebar and navbar enabled
  if (isHomePage) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
        <Footer />
        <FloatingLobbyChat />
        <BottomNavbar />
      </>
    )
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

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarWidth, setSidebarWidth] = useState('18rem') // Default w-72
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  
  // Don't apply sidebar margin on auth pages, onboarding, and "is this game alive" pages
  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/onboarding' || pathname?.startsWith('/is-')

  useEffect(() => {
    // Check if we're on a large screen
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    // Get initial width from CSS variable or localStorage
    const updateWidth = () => {
      const width = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width')
        .trim()
      if (width) {
        setSidebarWidth(width)
      } else {
        // Fallback: check localStorage
        const isCompact = localStorage.getItem('sidebar_compact')
        setSidebarWidth(isCompact === 'true' ? '4rem' : '18rem')
      }
    }

    updateWidth()

    // Listen for changes to the CSS variable
    const observer = new MutationObserver(updateWidth)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    // Poll for changes (fallback)
    const interval = setInterval(updateWidth, 100)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', checkScreenSize)
      clearInterval(interval)
    }
  }, [])

  const shouldAddBottomPadding = !isAuthPage && !isLargeScreen
  
  return (
    <main
      className="min-h-[calc(100vh-4rem)] transition-all duration-300 lg:pb-0"
      style={{ 
        // Sidebar is hidden, so no left margin needed
        marginLeft: '0',
        paddingBottom: shouldAddBottomPadding ? `calc(7.5rem + env(safe-area-inset-bottom))` : undefined
      }}
    >
      {children}
    </main>
  )
}


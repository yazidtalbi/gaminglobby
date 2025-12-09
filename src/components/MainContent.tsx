'use client'

import { useEffect, useState } from 'react'

export function MainContent({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState('18rem') // Default w-72
  const [isLargeScreen, setIsLargeScreen] = useState(false)

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

  return (
    <main
      className="min-h-[calc(100vh-4rem)] transition-all duration-300"
      style={{ marginLeft: isLargeScreen ? sidebarWidth : '0' }}
    >
      {children}
    </main>
  )
}


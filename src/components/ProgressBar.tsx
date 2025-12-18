'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef(0)
  const loadingRef = useRef(false)

  const startProgress = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    loadingRef.current = true
    setLoading(true)
    progressRef.current = 10
    setProgress(10)

    // Rapid progress animation
    intervalRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + (progressRef.current < 50 ? 20 : 8), 90)
      setProgress(progressRef.current)
      
      if (progressRef.current >= 90) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, 80)
  }, [])

  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setProgress(100)
    setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
      setProgress(0)
      progressRef.current = 0
    }, 200)
  }, [])

  // Listen for link clicks to start immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]')
      
      if (link) {
        const href = link.getAttribute('href')
        // Only trigger for internal links
        if (href && href.startsWith('/')) {
          // Don't trigger for same-page links
          if (href === pathname) return
          
          // Start progress immediately on click (before Next.js navigation)
          startProgress()
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, startProgress])

  // Handle pathname changes (for programmatic navigation)
  useEffect(() => {
    // If we're not already loading, start progress
    // This handles programmatic navigation via router.push()
    if (!loadingRef.current) {
      const timeout = setTimeout(() => {
        startProgress()
      }, 10)

      return () => clearTimeout(timeout)
    }
  }, [pathname, searchParams, startProgress])

  // Complete when page is loaded
  useEffect(() => {
    const handleLoad = () => {
      completeProgress()
    }

    // Check if already loaded
    if (document.readyState === 'complete') {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(handleLoad, 100)
      return () => clearTimeout(timeout)
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pathname, completeProgress])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  if (!loading && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-transparent">
      <div
        className="h-full bg-cyan-400 transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(34, 211, 238, 0.5), 0 0 5px rgba(34, 211, 238, 0.3)',
        }}
      />
    </div>
  )
}

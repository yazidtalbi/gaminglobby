'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ProgressBar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start loading when pathname changes
    setLoading(true)
    setProgress(0)

    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        // Faster progress initially, slower as it approaches completion
        const increment = prev < 50 ? 15 : 5
        return Math.min(prev + increment, 90)
      })
    }, 100)

    // Complete the progress bar quickly after a short delay
    const timeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200)
    }, 300)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [pathname])

  if (!loading && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-transparent">
      <div
        className="h-full bg-cyan-400 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(34, 211, 238, 0.5), 0 0 5px rgba(34, 211, 238, 0.3)',
        }}
      />
    </div>
  )
}

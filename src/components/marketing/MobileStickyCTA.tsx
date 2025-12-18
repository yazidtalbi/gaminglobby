'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'

export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md p-4">
      <div className="flex gap-2">
        <Button
          asChild
          className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold"
          size="sm"
        >
          <Link href="/games">
            Browse Games
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="flex-1 border-slate-700 text-slate-200"
          size="sm"
        >
          <Link href="/games">
            <Plus className="mr-1 w-4 h-4" />
            Create Lobby
          </Link>
        </Button>
      </div>
    </div>
  )
}

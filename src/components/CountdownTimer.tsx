'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string
  onComplete?: () => void
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        onComplete?.()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onComplete])

  if (!timeLeft) {
    return <div className="text-slate-400">Calculating...</div>
  }

  const { days, hours, minutes, seconds } = timeLeft

  return (
    <div className="flex items-center gap-4">
      {days > 0 && (
        <div className="text-center">
          <div className="text-2xl font-title text-white">{days}</div>
          <div className="text-xs text-slate-400">days</div>
        </div>
      )}
      <div className="text-center">
        <div className="text-2xl font-title text-white">{hours.toString().padStart(2, '0')}</div>
        <div className="text-xs text-slate-400">hours</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-title text-white">{minutes.toString().padStart(2, '0')}</div>
        <div className="text-xs text-slate-400">minutes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-title text-white">{seconds.toString().padStart(2, '0')}</div>
        <div className="text-xs text-slate-400">seconds</div>
      </div>
    </div>
  )
}


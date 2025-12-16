'use client'

import { useEffect, useState } from 'react'
import { Users, Gamepad2, Clock } from 'lucide-react'

interface ActivityStats {
  activeLobbies: number
  activeUsers: number
  totalUsers: number
  recentLobbiesCount: number
  lastLobbyCreated: string | null
  timestamp: string
}

export function LiveActivityIndicator() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/activity/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch activity stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    
    // Update every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-600 rounded-full animate-pulse" />
          <span>Loading activity...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2 text-cyan-400">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span className="font-medium">{stats.activeLobbies}</span>
        <span className="text-slate-400">active lobbies</span>
      </div>
      
      <div className="flex items-center gap-2 text-green-400">
        <Users className="w-4 h-4" />
        <span className="font-medium">{stats.activeUsers}</span>
        <span className="text-slate-400">players online</span>
      </div>
      
      {stats.recentLobbiesCount > 0 && (
        <div className="flex items-center gap-2 text-amber-400">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{stats.recentLobbiesCount}</span>
          <span className="text-slate-400">new in last hour</span>
        </div>
      )}
    </div>
  )
}

export function LiveActivityCounter({ 
  showLabel = true,
  compact = false 
}: { 
  showLabel?: boolean
  compact?: boolean 
}) {
  const [stats, setStats] = useState<ActivityStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/activity/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch activity stats:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-slate-600 rounded-full animate-pulse" />
        {showLabel && <span className="text-slate-400 text-sm">Loading...</span>}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span className="font-semibold text-white">{stats.activeLobbies}</span>
        {showLabel && <span className="text-slate-400 text-sm">active</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      <span className="font-semibold text-white">{stats.activeLobbies}</span>
      {showLabel && <span className="text-slate-400 text-sm">lobbies active now</span>}
    </div>
  )
}

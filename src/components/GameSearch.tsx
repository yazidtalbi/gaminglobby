'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Gamepad2 } from 'lucide-react'

interface GameResult {
  id: number
  name: string
  verified: boolean
  coverUrl: string | null
}

interface GameSearchProps {
  onSelect?: (game: GameResult) => void
  navigateOnSelect?: boolean
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  autoFocus?: boolean
}

export function GameSearch({
  onSelect,
  navigateOnSelect = true,
  placeholder = 'Search games...',
  className = '',
  size = 'md',
  autoFocus = false,
}: GameSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/steamgriddb/search?query=${encodeURIComponent(debouncedQuery)}`)
        const data = await response.json()
        setResults(data.results || [])
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (game: GameResult) => {
    // Log search event
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('game_search_events').insert({
        game_id: game.id.toString(),
        user_id: user?.id || null,
      })
    } catch (error) {
      console.error('Failed to log search event:', error)
    }

    if (onSelect) {
      onSelect(game)
    }

    if (navigateOnSelect) {
      router.push(`/games/${game.id}`)
    }

    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full ${sizeClasses[size]} pl-11 pr-10
            bg-slate-800/50 border border-slate-700/50 rounded-xl
            text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
            transition-all duration-200
          `}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {results.map((game, index) => (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className={`
                  w-full flex items-center gap-3 p-3 text-left
                  transition-colors duration-150
                  ${index === selectedIndex ? 'bg-slate-700' : 'hover:bg-slate-700/50'}
                `}
              >
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt={game.name}
                    className="w-10 h-14 object-cover rounded-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{game.name}</p>
                  {game.verified && (
                    <span className="text-xs text-emerald-400">Verified</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 text-center text-slate-400">
          No games found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Gamepad2, Loader2 } from 'lucide-react'
import { GameCard } from '@/components/GameCard'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/steamgriddb/search?query=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(search, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-title text-white mb-2 flex items-center gap-3">
            <Search className="w-8 h-8 text-cyan-400" />
            Search Games
          </h1>
          <p className="text-slate-400">
            Search for games, communities, and players
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                const url = new URL(window.location.href)
                if (e.target.value) {
                  url.searchParams.set('q', e.target.value)
                } else {
                  url.searchParams.delete('q')
                }
                window.history.replaceState({}, '', url.toString())
              }}
              placeholder="Search games..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-lg"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 ? (
          <div>
            <h2 className="text-lg font-title text-white mb-4">
              {isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            {!isLoading && results.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No games found</p>
                <p className="text-sm text-slate-500">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((game) => (
                  <GameCard
                    key={game.id}
                    id={game.id.toString()}
                    name={game.name}
                    coverUrl={game.coverUrl}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Start searching for games</p>
            <p className="text-sm text-slate-500">
              Type in the search box above to find your favorite games
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

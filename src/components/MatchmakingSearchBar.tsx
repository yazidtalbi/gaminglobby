'use client'

import { useState, useRef } from 'react'
import Search from '@mui/icons-material/Search'
import { NavbarSearchModal } from './NavbarSearchModal'

export function MatchmakingSearchBar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearchClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              onClick={handleSearchClick}
              readOnly
              placeholder="Search for any game..."
              className="w-full h-14 pl-12 pr-32 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            />
            <button
              onClick={handleSearchClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all shadow-lg"
            >
              <span>Search</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <NavbarSearchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}


'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, List, ListOrdered, Grid3x3, Grid2x2, X } from 'lucide-react'

export type SortOption = 'recent' | 'recently_added' | 'alphabetical' | 'creator'
export type ViewMode = 'list' | 'detailed' | 'grid' | 'grid_large'

interface SidebarControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  viewMode: ViewMode
  onViewModeChange: (view: ViewMode) => void
  alphabeticalReverse: boolean
  onAlphabeticalReverseChange: (reverse: boolean) => void
}

const sortLabels: Record<SortOption, string> = {
  recent: 'Recent',
  recently_added: 'Recently Added',
  alphabetical: 'Alphabetical Order',
  creator: 'Creator',
}

const viewIcons = {
  list: List,
  detailed: ListOrdered,
  grid: Grid3x3,
  grid_large: Grid2x2,
}

const viewLabels = {
  list: 'List',
  detailed: 'Detailed List',
  grid: 'Grid',
  grid_large: 'Large Grid',
}

export function SidebarControls({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  alphabeticalReverse,
  onAlphabeticalReverseChange,
}: SidebarControlsProps) {
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when it becomes visible
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchInput])

  // Close search if query is cleared via the X button (handled in onClick)

  const ViewIcon = viewIcons[viewMode]

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Search Icon/Input */}
      <div className="relative">
        {showSearchInput ? (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={(e) => {
                // Only close if query is empty and user clicked outside
                // Use setTimeout to check after any potential button clicks
                setTimeout(() => {
                  if (!searchQuery && document.activeElement !== searchInputRef.current) {
                    setShowSearchInput(false)
                  }
                }, 200)
              }}
              placeholder="Search games..."
              className="w-48 pl-8 pr-6 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('')
                  setShowSearchInput(false)
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowSearchInput(true)
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Search games"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Combined Sort & View Dropdown */}
      <div ref={menuRef} className="relative">
        <button
          ref={buttonRef}
          onClick={() => {
            if (!showMenu && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect()
              setMenuPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
              })
            }
            setShowMenu(!showMenu)
          }}
          className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ViewIcon className="w-3 h-3" />
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        {showMenu && (
          <div
            className="fixed w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[60] overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
          >
            {/* Sort Options */}
            <div className="p-2">
              <p className="text-xs font-title text-slate-400 px-2 py-1.5">
                Sort by
              </p>
              {(['recently_added', 'alphabetical'] as SortOption[]).map((option) => {
                const isAlphabetical = option === 'alphabetical'
                const isSelected = sortBy === option
                const showReverse = isAlphabetical && isSelected && alphabeticalReverse
                
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (isAlphabetical && isSelected) {
                        // Toggle reverse if clicking alphabetical again
                        onAlphabeticalReverseChange(!alphabeticalReverse)
                      } else {
                        // Change sort option
                        onSortChange(option)
                        // Reset reverse state when switching sort options
                        onAlphabeticalReverseChange(false)
                      }
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded transition-colors ${
                      isSelected
                        ? 'bg-app-green-500/20 text-app-green-400'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span>
                      {sortLabels[option]}
                      {showReverse && ' (Z-A)'}
                    </span>
                    {isSelected && (
                      <ChevronDown className={`w-3 h-3 text-app-green-400 ${showReverse ? '' : 'rotate-180'}`} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Separator */}
            <div className="border-t border-slate-700"></div>

            {/* View Mode Options */}
            <div className="p-2">
              <p className="text-xs font-title text-slate-400 px-2 py-1.5 mb-2">
                Display mode
              </p>
              {(['list', 'detailed', 'grid', 'grid_large'] as ViewMode[]).map((mode) => {
                const Icon = viewIcons[mode]
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      onViewModeChange(mode)
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 text-sm rounded transition-colors ${
                      viewMode === mode
                        ? 'bg-app-green-500/20 text-app-green-400'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{viewLabels[mode]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


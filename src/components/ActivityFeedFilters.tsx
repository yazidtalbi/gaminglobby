'use client'

import { ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ActivityFeedFiltersProps {
  filter: 'all' | 'followed' | string
  typeFilter: string | null
  onFilterChange: (filter: 'all' | 'followed' | string) => void
  onTypeFilterChange: (type: string | null) => void
}

const activityTypes = [
  { value: null, label: 'All Types' },
  { value: 'lobby_created', label: 'Lobby Created' },
  { value: 'lobby_joined', label: 'Lobby Joined' },
  { value: 'game_added', label: 'Game Added' },
  { value: 'event_created', label: 'Event Created' },
  { value: 'event_joined', label: 'Event Joined' },
  { value: 'user_followed', label: 'User Followed' },
  { value: 'recent_encounter', label: 'Recent Encounters' },
]

export function ActivityFeedFilters({
  filter,
  typeFilter,
  onFilterChange,
  onTypeFilterChange,
}: ActivityFeedFiltersProps) {
  const selectedType = activityTypes.find(type => type.value === typeFilter) || activityTypes[0]

  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      {/* Main Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 text-sm font-title transition-colors ${
            filter === 'all'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange('followed')}
          className={`px-4 py-2 text-sm font-title transition-colors ${
            filter === 'followed'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
          }`}
        >
          Following
        </button>
      </div>

      {/* Type Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="px-4 py-2 text-sm font-title bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex items-center gap-2">
          {selectedType.label}
          <ChevronDown className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {activityTypes.map((type) => (
            <DropdownMenuItem
              key={type.value || 'all'}
              onClick={() => onTypeFilterChange(type.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{type.label}</span>
              {type.value === typeFilter && (
                <Check className="w-4 h-4 text-cyan-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


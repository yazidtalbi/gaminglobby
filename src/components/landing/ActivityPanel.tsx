'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { DemoBadge } from './activity/DemoBadge'
import type { ActivityResponse } from '@/lib/activity/getActivity'

interface ActivityPanelProps {
  activity: ActivityResponse
}

export function ActivityPanel({ activity }: ActivityPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('lobbies')

  const filteredLobbies = useMemo(() => {
    if (!searchQuery) return activity.lobbies
    const query = searchQuery.toLowerCase()
    return activity.lobbies.filter(
      (item) =>
        item.game_name.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query)
    )
  }, [activity.lobbies, searchQuery])

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return activity.players
    const query = searchQuery.toLowerCase()
    return activity.players.filter(
      (item) =>
        item.game_name.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query) ||
        item.display_name?.toLowerCase().includes(query)
    )
  }, [activity.players, searchQuery])

  const filteredGames = useMemo(() => {
    if (!searchQuery) return activity.games
    const query = searchQuery.toLowerCase()
    return activity.games.filter((item) =>
      item.name.toLowerCase().includes(query)
    )
  }, [activity.games, searchQuery])

  const renderItem = (
    item: any,
    showGame: boolean = false,
    showPlatform: boolean = true
  ) => {
    const isNew = item.recency === 'Just now' || (item.recency && item.recency.endsWith('m ago'))
    const minutesMatch = item.recency?.match(/(\d+)m ago/)
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 999

    return (
      <div
        key={item.id}
        className="group flex items-center gap-3 py-2 px-3 rounded hover:bg-slate-800/50 transition-colors border-b border-slate-800/30 last:border-0"
      >
        <div className="relative shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${
              isNew && minutes <= 5
                ? 'bg-green-400 animate-pulse'
                : item.is_demo
                ? 'bg-slate-600'
                : 'bg-cyan-400'
            }`}
          />
          {isNew && minutes <= 5 && !item.is_demo && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white truncate">
              {item.title || item.display_name || item.username || item.name}
            </span>
            {showGame && (
              <span className="text-xs text-slate-400 truncate">
                {item.game_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {showPlatform && item.platform && (
              <>
                <span>{item.platform}</span>
                {item.region && <span>•</span>}
              </>
            )}
            {item.region && <span>{item.region}</span>}
            {(item.players || item.lobbies_count) && (
              <>
                {(item.platform || item.region) && <span>•</span>}
                <span>
                  {item.players || `${item.lobbies_count} lobbies`}
                </span>
              </>
            )}
            {item.players_count && (
              <>
                <span>•</span>
                <span>{item.players_count} players</span>
              </>
            )}
            <span>•</span>
            <span className="text-slate-500">{item.recency}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white">What&apos;s happening now</h3>
        <DemoBadge mode={activity.mode} />
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search a game…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-slate-800/50 border-slate-700 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-none border-b border-slate-800 bg-transparent h-auto p-0">
          <TabsTrigger
            value="lobbies"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            Lobbies
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            Players
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent"
          >
            Games
          </TabsTrigger>
        </TabsList>

        <div className="relative max-h-[480px] overflow-y-auto">
          {/* Gradient fade at bottom */}
          <div className="sticky bottom-0 h-8 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none z-10" />

          <TabsContent value="lobbies" className="mt-0 p-0">
            {filteredLobbies.length > 0 ? (
              filteredLobbies.map((item) => renderItem(item, true))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No lobbies found
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="mt-0 p-0">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((item) => renderItem(item, true))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No players found
              </div>
            )}
          </TabsContent>

          <TabsContent value="games" className="mt-0 p-0">
            {filteredGames.length > 0 ? (
              filteredGames.map((item) => renderItem(item, false, false))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No games found
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <p className="text-xs text-slate-500 text-center">
          Last activity update: {new Date(activity.updatedAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

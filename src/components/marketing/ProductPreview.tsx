'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, Gamepad2, Zap } from 'lucide-react'

export function ProductPreview() {
  return (
    <div className="relative">
      {/* Floating nodes effect */}
      <div className="absolute -top-4 -left-4 neon-node" style={{ animationDelay: '0s' }} />
      <div className="absolute top-1/4 -right-8 neon-node" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/4 -left-6 neon-node" style={{ animationDelay: '4s' }} />

      <Card className="border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-slate-400">Live Preview</span>
            </div>
            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
              Apoxer
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Left: Games List */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Games
              </div>
              <div className="space-y-1.5">
                {['Counter-Strike 2', 'Team Fortress 2', 'Battlefield 3', 'Left 4 Dead 2'].map((game, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="text-xs font-medium text-white line-clamp-1">{game}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {i === 0 ? '3 lobbies' : i === 1 ? '1 lobby' : 'Active'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Active Lobbies */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Lobbies
              </div>
              <div className="space-y-1.5">
                {[
                  { title: 'Ranked 5v5', players: '7/10', time: '2m ago' },
                  { title: 'Casual DM', players: '4/8', time: '5m ago' },
                  { title: 'Wingman', players: '1/2', time: '12m ago' },
                ].map((lobby, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="text-xs font-medium text-white line-clamp-1 mb-1">{lobby.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Users className="w-3 h-3" />
                      <span>{lobby.players}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{lobby.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Player Tags */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Players
              </div>
              <div className="space-y-1.5">
                {[
                  { name: 'Alex', tags: ['Competitive', 'EU'], active: true },
                  { name: 'Sam', tags: ['Casual', 'NA'], active: true },
                  { name: 'Jordan', tags: ['Chill', 'OCE'], active: false },
                ].map((player, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="text-xs font-medium text-white">{player.name}</div>
                      {player.active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player.tags.map((tag, j) => (
                        <Badge
                          key={j}
                          variant="outline"
                          className="text-[10px] px-1 py-0 border-slate-700 text-slate-400"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Quick Action */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Real-time updates</span>
            </div>
            <Badge variant="success" className="text-xs">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

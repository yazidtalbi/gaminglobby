'use client'

import { TournamentWithHost } from '@/types/tournaments'
import { useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RewardsStripProps {
  tournament: TournamentWithHost
}

export function RewardsStrip({ tournament }: RewardsStripProps) {
  const [selectedBadge, setSelectedBadge] = useState<{
    label: string
    imageUrl: string | null
    place: string
  } | null>(null)

  const hasRewards =
    tournament.badge_1st_label || tournament.badge_2nd_label || tournament.badge_3rd_label

  if (!hasRewards) return null

  return (
    <div>
      <h2 className="text-xl font-title text-white mb-4 uppercase">Rewards</h2>
      <div className="flex flex-col gap-3">
        {tournament.badge_1st_label && (
          <button
            onClick={() =>
              setSelectedBadge({
                label: tournament.badge_1st_label!,
                imageUrl: tournament.badge_1st_image_url,
                place: '1st Place',
              })
            }
            className="flex items-center gap-3 p-3 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-lg w-full text-left"
          >
            <div className="w-16 h-16 border border-slate-700 bg-slate-800 flex items-center justify-center rounded flex-shrink-0">
              {tournament.badge_1st_image_url ? (
                <img
                  src={tournament.badge_1st_image_url}
                  alt={tournament.badge_1st_label}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <Trophy className="w-8 h-8 text-yellow-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-title uppercase text-cyan-400 mb-1">Champion</p>
              <p className="text-sm font-semibold text-white truncate">{tournament.badge_1st_label}</p>
            </div>
          </button>
        )}

        {tournament.badge_2nd_label && (
          <button
            onClick={() =>
              setSelectedBadge({
                label: tournament.badge_2nd_label!,
                imageUrl: tournament.badge_2nd_image_url,
                place: '2nd Place',
              })
            }
            className="flex items-center gap-3 p-3 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-lg w-full text-left"
          >
            <div className="w-16 h-16 border border-slate-700 bg-slate-800 flex items-center justify-center rounded flex-shrink-0">
              {tournament.badge_2nd_image_url ? (
                <img
                  src={tournament.badge_2nd_image_url}
                  alt={tournament.badge_2nd_label}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <Medal className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-title uppercase text-cyan-400 mb-1">Finalist</p>
              <p className="text-sm font-semibold text-white truncate">{tournament.badge_2nd_label}</p>
            </div>
          </button>
        )}

        {tournament.badge_3rd_label && (
          <button
            onClick={() =>
              setSelectedBadge({
                label: tournament.badge_3rd_label!,
                imageUrl: tournament.badge_3rd_image_url,
                place: '3rd Place',
              })
            }
            className="flex items-center gap-3 p-3 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-lg w-full text-left"
          >
            <div className="w-16 h-16 border border-slate-700 bg-slate-800 flex items-center justify-center rounded flex-shrink-0">
              {tournament.badge_3rd_image_url ? (
                <img
                  src={tournament.badge_3rd_image_url}
                  alt={tournament.badge_3rd_label}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <Award className="w-8 h-8 text-amber-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-title uppercase text-cyan-400 mb-1">Participation</p>
              <p className="text-sm font-semibold text-white truncate">{tournament.badge_3rd_label}</p>
            </div>
          </button>
        )}
      </div>

      {/* Badge Preview Modal */}
      {selectedBadge && (
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedBadge.place} Badge</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {selectedBadge.imageUrl ? (
                <img
                  src={selectedBadge.imageUrl}
                  alt={selectedBadge.label}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 border border-slate-700 bg-slate-800 flex items-center justify-center">
                  <Trophy className="w-24 h-24 text-yellow-400" />
                </div>
              )}
              <p className="text-xl font-semibold text-white">{selectedBadge.label}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

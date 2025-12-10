'use client'

import { PlayerEndorsement } from '@/types/database'
import { getAwardConfig, AwardType } from '@/lib/endorsements'

interface PlayerAwardsProps {
  endorsements: Array<{
    award_type: AwardType
    count: number
  }>
  variant?: 'full' | 'compact'
  maxDisplay?: number
}

export function PlayerAwards({ 
  endorsements, 
  variant = 'compact',
  maxDisplay = 3 
}: PlayerAwardsProps) {
  if (!endorsements || endorsements.length === 0) return null

  const sorted = [...endorsements]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay)

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {sorted.map((endorsement) => {
          const config = getAwardConfig(endorsement.award_type)
          return (
            <div
              key={endorsement.award_type}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
              title={`${config.label} × ${endorsement.count}`}
            >
              <span>{config.emoji}</span>
              <span className="font-medium">{config.shortLabel}</span>
              <span className="text-slate-500">×{endorsement.count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((endorsement) => {
        const config = getAwardConfig(endorsement.award_type)
        return (
          <div
            key={endorsement.award_type}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg"
          >
            <span className="text-lg">{config.emoji}</span>
            <div>
              <div className="text-sm font-medium text-white">{config.label}</div>
              <div className="text-xs text-slate-400">× {endorsement.count}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


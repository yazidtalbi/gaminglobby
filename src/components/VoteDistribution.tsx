'use client'

import { TimePreference } from './TimePreferencePicker'

interface VoteDistributionProps {
  distribution: Record<TimePreference, number>
  totalVotes: number
}

const timeLabels: Record<TimePreference, string> = {
  morning: 'Morning',
  noon: 'Noon',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late_night: 'Late Night',
}

export function VoteDistribution({ distribution, totalVotes }: VoteDistributionProps) {
  if (totalVotes === 0) {
    return <div className="text-sm text-slate-500">No votes yet</div>
  }

  const maxVotes = Math.max(...Object.values(distribution))

  return (
    <div className="space-y-2">
      {(Object.keys(distribution) as TimePreference[]).map((pref) => {
        const count = distribution[pref]
        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0
        const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0

        return (
          <div key={pref} className="flex items-center gap-3">
            <div className="w-20 text-xs text-slate-400 text-right">{timeLabels[pref]}</div>
            <div className="flex-1 bg-slate-700/50 h-4 relative">
              <div
                className="h-full bg-cyan-500/50 transition-all duration-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="w-12 text-xs text-slate-300 text-right">
              {count} ({Math.round(percentage)}%)
            </div>
          </div>
        )
      })}
    </div>
  )
}


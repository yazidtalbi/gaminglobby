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

const timeColors: Record<TimePreference, string> = {
  morning: 'bg-yellow-500',
  noon: 'bg-orange-500',
  afternoon: 'bg-cyan-500',
  evening: 'bg-blue-500',
  late_night: 'bg-purple-500',
}

export function VoteDistribution({ distribution, totalVotes }: VoteDistributionProps) {
  if (totalVotes === 0) {
    return <div className="text-sm text-slate-500">No votes yet</div>
  }

  // Create segments for the bar chart
  const segments: Array<{ pref: TimePreference; count: number; percentage: number; width: number }> = []
  let cumulativeWidth = 0

  ;(Object.keys(distribution) as TimePreference[]).forEach((pref) => {
    const count = distribution[pref]
    if (count > 0) {
      const percentage = (count / totalVotes) * 100
      segments.push({
        pref,
        count,
        percentage,
        width: cumulativeWidth,
      })
      cumulativeWidth += percentage
    }
  })

  return (
    <div className="space-y-3">
      {/* Horizontal bar chart */}
      <div className="relative h-8 bg-slate-700/50 overflow-hidden">
        {segments.map((segment, index) => {
          const isFirst = index === 0
          const isLast = index === segments.length - 1
          return (
            <div
              key={segment.pref}
              className={`absolute top-0 h-full ${timeColors[segment.pref]} transition-all duration-300 ${
                isFirst ? 'rounded-l-sm' : ''
              } ${isLast ? 'rounded-r-sm' : ''}`}
              style={{
                left: `${segment.width}%`,
                width: `${segment.percentage}%`,
              }}
            />
          )
        })}
      </div>

      {/* Labels and counts */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {segments.map((segment) => (
          <div key={segment.pref} className="flex items-center gap-2">
            <div className={`w-2 h-2 ${timeColors[segment.pref]}`} />
            <span className="text-xs text-white">{timeLabels[segment.pref]}</span>
            <span className="text-xs text-slate-400">{segment.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


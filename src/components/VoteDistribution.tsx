'use client'

import { TimePreference } from './TimePreferencePicker'
import { DayPreference } from './DayPreferencePicker'

interface VoteDistributionProps {
  distribution: Record<TimePreference, number>
  dayDistribution?: Record<DayPreference, number>
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

const dayLabels: Record<DayPreference, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const dayColors: Record<DayPreference, string> = {
  monday: 'bg-red-500',
  tuesday: 'bg-orange-500',
  wednesday: 'bg-yellow-500',
  thursday: 'bg-green-500',
  friday: 'bg-blue-500',
  saturday: 'bg-indigo-500',
  sunday: 'bg-purple-500',
}

export function VoteDistribution({ distribution, dayDistribution, totalVotes }: VoteDistributionProps) {
  if (totalVotes === 0) {
    return <div className="text-sm text-slate-500">No votes yet</div>
  }

  // Create segments for time distribution bar chart
  const timeSegments: Array<{ pref: TimePreference; count: number; percentage: number; width: number }> = []
  let cumulativeWidth = 0

  ;(Object.keys(distribution) as TimePreference[]).forEach((pref) => {
    const count = distribution[pref] || 0
    if (count > 0) {
      const percentage = (count / totalVotes) * 100
      timeSegments.push({
        pref,
        count,
        percentage,
        width: cumulativeWidth,
      })
      cumulativeWidth += percentage
    }
  })

  // Create segments for day distribution bar chart
  const daySegments: Array<{ pref: DayPreference; count: number; percentage: number; width: number }> = []
  let dayCumulativeWidth = 0

  if (dayDistribution) {
    ;(Object.keys(dayDistribution) as DayPreference[]).forEach((pref) => {
      const count = dayDistribution[pref] || 0
      if (count > 0) {
        const percentage = (count / totalVotes) * 100
        daySegments.push({
          pref,
          count,
          percentage,
          width: dayCumulativeWidth,
        })
        dayCumulativeWidth += percentage
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Time Distribution */}
      {timeSegments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Time Preferences</p>
          {/* Horizontal bar chart */}
          <div className="relative h-8 bg-slate-700/50 overflow-hidden">
            {timeSegments.map((segment, index) => {
              const isFirst = index === 0
              const isLast = index === timeSegments.length - 1
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
            {timeSegments.map((segment) => (
              <div key={segment.pref} className="flex items-center gap-2">
                <div className={`w-2 h-2 ${timeColors[segment.pref]}`} />
                <span className="text-xs text-white">{timeLabels[segment.pref]}</span>
                <span className="text-xs text-slate-400">{segment.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Distribution */}
      {daySegments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Day Preferences</p>
          {/* Horizontal bar chart */}
          <div className="relative h-8 bg-slate-700/50 overflow-hidden">
            {daySegments.map((segment, index) => {
              const isFirst = index === 0
              const isLast = index === daySegments.length - 1
              return (
                <div
                  key={segment.pref}
                  className={`absolute top-0 h-full ${dayColors[segment.pref]} transition-all duration-300 ${
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
            {daySegments.map((segment) => (
              <div key={segment.pref} className="flex items-center gap-2">
                <div className={`w-2 h-2 ${dayColors[segment.pref]}`} />
                <span className="text-xs text-white">{dayLabels[segment.pref]}</span>
                <span className="text-xs text-slate-400">{segment.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


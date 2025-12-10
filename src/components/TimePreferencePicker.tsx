'use client'

import { useState } from 'react'

export type TimePreference = 'morning' | 'noon' | 'afternoon' | 'evening' | 'late_night'

interface TimePreferencePickerProps {
  value: TimePreference | null
  onChange: (pref: TimePreference) => void
  disabled?: boolean
}

const timeLabels: Record<TimePreference, string> = {
  morning: 'Morning (10:00)',
  noon: 'Noon (12:00)',
  afternoon: 'Afternoon (15:00)',
  evening: 'Evening (18:00)',
  late_night: 'Late Night (21:00)',
}

export function TimePreferencePicker({ value, onChange, disabled }: TimePreferencePickerProps) {
  const preferences: TimePreference[] = ['morning', 'noon', 'afternoon', 'evening', 'late_night']

  return (
    <div className="flex flex-wrap gap-2">
      {preferences.map((pref) => (
        <button
          key={pref}
          type="button"
          onClick={() => !disabled && onChange(pref)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-title transition-colors relative ${
            value === pref
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Corner brackets */}
          <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
          <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
          <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
          <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
          <span className="relative z-10">
            {timeLabels[pref]}
          </span>
        </button>
      ))}
    </div>
  )
}


'use client'

export type DayPreference = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

interface DayPreferencePickerProps {
  value: DayPreference | null
  onChange: (pref: DayPreference) => void
  disabled?: boolean
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

export function DayPreferencePicker({ value, onChange, disabled }: DayPreferencePickerProps) {
  const days: DayPreference[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => !disabled && onChange(day)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-title transition-colors relative ${
            value === day
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
            {dayLabels[day]}
          </span>
        </button>
      ))}
    </div>
  )
}


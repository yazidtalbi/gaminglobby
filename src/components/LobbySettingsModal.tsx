'use client'

import { useState } from 'react'
import { X, Users, Lock, UserCheck, Mail, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LobbySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  lobbyId: string
  currentMaxPlayers: number | null
  currentVisibility: 'public' | 'followers_only' | 'invite_only' | null
  currentMemberCount: number
  onUpdate: () => void
}

export function LobbySettingsModal({
  isOpen,
  onClose,
  lobbyId,
  currentMaxPlayers,
  currentVisibility,
  currentMemberCount,
  onUpdate,
}: LobbySettingsModalProps) {
  const [maxPlayers, setMaxPlayers] = useState<number>(currentMaxPlayers || currentMemberCount)
  const [visibility, setVisibility] = useState<'public' | 'followers_only' | 'invite_only'>(currentVisibility || 'public')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Validate max players - must be at least current member count and can only increase
      const minMaxPlayers = Math.max(currentMemberCount, currentMaxPlayers || currentMemberCount)
      if (maxPlayers < minMaxPlayers) {
        setError(`Maximum players must be at least ${minMaxPlayers} (current members: ${currentMemberCount})`)
        setIsSaving(false)
        return
      }

      const updates: { max_players?: number; visibility?: string } = {}

      // Only update max_players if it changed and is greater than current
      if (maxPlayers !== currentMaxPlayers && maxPlayers >= minMaxPlayers) {
        updates.max_players = maxPlayers
      }

      // Only update visibility if it changed
      if (visibility !== currentVisibility) {
        updates.visibility = visibility
      }

      if (Object.keys(updates).length === 0) {
        onClose()
        return
      }

      const { error: updateError } = await supabase
        .from('lobbies')
        .update(updates)
        .eq('id', lobbyId)

      if (updateError) {
        setError(updateError.message || 'Failed to update lobby settings')
      } else {
        onUpdate()
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update lobby settings')
    } finally {
      setIsSaving(false)
    }
  }

  const visibilityOptions = [
    {
      value: 'public' as const,
      label: 'Public',
      description: 'Anyone can join',
      icon: Users,
      color: 'text-green-400',
    },
    {
      value: 'followers_only' as const,
      label: 'Followers Only',
      description: 'Only users you follow can join',
      icon: UserCheck,
      color: 'text-blue-400',
    },
    {
      value: 'invite_only' as const,
      label: 'Invite Only',
      description: 'Only invited users can join',
      icon: Mail,
      color: 'text-purple-400',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Lobby Settings</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Maximum Players
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={Math.max(currentMemberCount, currentMaxPlayers || currentMemberCount)}
                max={50}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || currentMemberCount)}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
                disabled={isSaving}
              />
              <span className="text-sm text-slate-400 whitespace-nowrap">
                Current: {currentMemberCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              You can only increase the maximum players. Minimum: {Math.max(currentMemberCount, currentMaxPlayers || currentMemberCount)}
            </p>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Lobby Visibility
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon
                const isSelected = visibility === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setVisibility(option.value)}
                    disabled={isSaving}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-700/50 border-app-green-500/50'
                        : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/40'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? option.color : 'text-slate-400'}`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-app-green-400 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-app-green-600 hover:bg-app-green-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

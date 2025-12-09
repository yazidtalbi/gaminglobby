'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GameSearch } from './GameSearch'
import { X, Loader2 } from 'lucide-react'

interface AddGameModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onGameAdded?: () => void
}

export function AddGameModal({ isOpen, onClose, userId, onGameAdded }: AddGameModalProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  if (!isOpen) return null

  const handleSelectGame = async (game: { id: number; name: string }) => {
    setIsAdding(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('user_games')
        .insert({
          user_id: userId,
          game_id: game.id.toString(),
          game_name: game.name,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('You already have this game in your library')
        } else {
          throw insertError
        }
      } else {
        onGameAdded?.()
        onClose()
      }
    } catch (err) {
      console.error('Failed to add game:', err)
      setError('Failed to add game. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add Game to Library</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isAdding ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Search for a game to add to your profile
              </p>
              <GameSearch
                onSelect={(game) => handleSelectGame(game)}
                navigateOnSelect={false}
                placeholder="Search games..."
                autoFocus
              />
              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


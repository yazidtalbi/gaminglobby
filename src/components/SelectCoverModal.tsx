'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Check } from 'lucide-react'

interface Cover {
  id: number
  url: string
  thumb: string
  score: number
  width: number
  height: number
}

interface SelectCoverModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  gameName: string
  onCoverSelected?: () => void
}

export function SelectCoverModal({
  isOpen,
  onClose,
  gameId,
  gameName,
  onCoverSelected,
}: SelectCoverModalProps) {
  const [covers, setCovers] = useState<Cover[]>([])
  const [selectedCover, setSelectedCover] = useState<Cover | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSelectedCover, setCurrentSelectedCover] = useState<{ url: string; thumb: string } | null>(null)

  // Fetch covers when modal opens
  useEffect(() => {
    if (isOpen && gameId) {
      fetchCovers()
      fetchCurrentSelectedCover()
    }
  }, [isOpen, gameId])

  const fetchCovers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/games/${gameId}/covers`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch covers')
      }

      setCovers(data.covers || [])
    } catch (err) {
      console.error('Failed to fetch covers:', err)
      setError('Failed to load covers. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCurrentSelectedCover = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/selected-cover`)
      const data = await response.json()

      if (response.ok && data.coverUrl) {
        setCurrentSelectedCover({
          url: data.coverUrl,
          thumb: data.coverThumb,
        })
      }
    } catch (err) {
      console.error('Failed to fetch current selected cover:', err)
    }
  }

  // Update selected cover when covers are loaded and we have a current selection
  useEffect(() => {
    if (covers.length > 0 && currentSelectedCover) {
      const match = covers.find((c) => c.url === currentSelectedCover.url || c.thumb === currentSelectedCover.thumb)
      if (match) {
        setSelectedCover(match)
      }
    }
  }, [covers, currentSelectedCover])

  const handleSelectCover = (cover: Cover) => {
    setSelectedCover(cover)
  }

  const handleSave = async () => {
    if (!selectedCover) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/games/${gameId}/selected-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverUrl: selectedCover.url,
          coverThumb: selectedCover.thumb,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save selected cover')
      }

      onCoverSelected?.()
      onClose()
    } catch (err) {
      console.error('Failed to save selected cover:', err)
      setError(err instanceof Error ? err.message : 'Failed to save selected cover. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/games/${gameId}/selected-cover`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove selected cover')
      }

      setSelectedCover(null)
      setCurrentSelectedCover(null)
      onCoverSelected?.()
    } catch (err) {
      console.error('Failed to remove selected cover:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove selected cover. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Select Cover for {gameName}</h2>
            <p className="text-sm text-slate-400 mt-1">Choose the best vertical cover for this game</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : error && !covers.length ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchCovers}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : covers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No vertical covers found for this game.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {covers.map((cover) => {
                const isSelected = selectedCover?.id === cover.id
                const isCurrentSelected = currentSelectedCover?.url === cover.url || currentSelectedCover?.thumb === cover.thumb

                return (
                  <button
                    key={cover.id}
                    onClick={() => handleSelectCover(cover)}
                    className={`
                      relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all
                      ${isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                        : 'border-slate-600 hover:border-slate-500'
                      }
                    `}
                  >
                    <img
                      src={cover.thumb}
                      alt={`Cover ${cover.id}`}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                        <div className="bg-cyan-400 rounded-full p-2">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    {isCurrentSelected && !isSelected && (
                      <div className="absolute top-2 right-2 bg-slate-700/90 text-white text-xs px-2 py-1 rounded">
                        Current
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white text-left">Score: {cover.score}</p>
                      <p className="text-xs text-slate-300 text-left">{cover.width} × {cover.height}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div>
            {currentSelectedCover && (
              <button
                onClick={handleRemove}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                Remove Selection
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedCover || isSaving}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Selection'
              )}
            </button>
          </div>
        </div>

        {error && covers.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

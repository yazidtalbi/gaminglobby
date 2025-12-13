'use client'

import { useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'

interface BadgeSelectorProps {
  label: string
  placement: 1 | 2 | 3
  gameSlug: string | null
  value: {
    label: string
    imageUrl: string | null
  }
  onChange: (label: string, imageUrl: string | null) => void
}

export function BadgeSelector({ label, placement, gameSlug, value, onChange }: BadgeSelectorProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)

  const fetchAchievementImages = async () => {
    if (!gameSlug) {
      setSearchError('Please select a game first')
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(`/api/tournaments/achievement-images?game=${encodeURIComponent(gameSlug)}`)
      const data = await response.json()

      if (response.ok && data.images) {
        setImages(data.images)
        setShowImagePicker(true)
      } else {
        setSearchError(data.error || 'No achievement images found')
      }
    } catch (error) {
      setSearchError('Failed to fetch images')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="border border-slate-700/50 bg-slate-800/30 p-4">
      <h3 className="text-lg font-title text-white mb-4">{label}</h3>

      {/* Badge Label */}
      <div className="mb-4">
        <label className="block text-sm font-title uppercase text-slate-400 mb-2">
          Badge Label
        </label>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange(e.target.value, value.imageUrl)}
          maxLength={50}
          placeholder={`e.g., ${placement === 1 ? 'Champion' : placement === 2 ? 'Runner-up' : 'Third Place'}`}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Badge Image */}
      <div className="mb-4">
        <label className="block text-sm font-title uppercase text-slate-400 mb-2">
          Badge Image
        </label>

        {value.imageUrl ? (
          <div className="relative">
            <div className="w-24 h-24 border border-slate-700 bg-slate-800 flex items-center justify-center">
              <img
                src={value.imageUrl}
                alt={value.label || 'Badge'}
                className="w-full h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(value.label, null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {!gameSlug ? (
              <div className="px-4 py-2 bg-slate-700/50 text-slate-500 text-sm">
                Please select a game first to search for achievement images
              </div>
            ) : (
              <button
                type="button"
                onClick={fetchAchievementImages}
                disabled={isSearching}
                className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                  isSearching
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find Achievement Image
                  </>
                )}
              </button>
            )}
            {searchError && (
              <p className="mt-2 text-sm text-red-400">{searchError}</p>
            )}
          </div>
        )}

        {/* Image Picker Modal */}
        {showImagePicker && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-title text-white">Select Achievement Image</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowImagePicker(false)
                    setImages([])
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {images.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No images found</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {images.map((imageUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        onChange(value.label, imageUrl)
                        setShowImagePicker(false)
                        setImages([])
                      }}
                      className="aspect-square border-2 border-slate-700 hover:border-cyan-400 bg-slate-800 overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={`Achievement ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

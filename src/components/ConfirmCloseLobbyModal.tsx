'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmCloseLobbyModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  lobbyTitle: string
}

export function ConfirmCloseLobbyModal({
  isOpen,
  onClose,
  onConfirm,
  lobbyTitle,
}: ConfirmCloseLobbyModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsClosing(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Failed to close lobby:', error)
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Close Lobby</h2>
          <button
            onClick={onClose}
            disabled={isClosing}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-medium">Are you sure you want to close this lobby?</p>
              <p className="text-amber-300/80 mt-1">This will disconnect all members and cannot be undone.</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Lobby: <span className="text-white font-medium">{lobbyTitle}</span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isClosing}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isClosing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isClosing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Closing...
                </>
              ) : (
                'Close Lobby'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


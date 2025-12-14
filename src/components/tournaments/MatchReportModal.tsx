'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { TournamentMatch, TournamentParticipant } from '@/types/tournaments'

interface MatchReportModalProps {
  match: TournamentMatch
  tournamentId: string
  participant: TournamentParticipant
  participant1: TournamentParticipant | null
  participant2: TournamentParticipant | null
  onClose: () => void
  onSuccess: () => void
}

export function MatchReportModal({
  match,
  tournamentId,
  participant,
  participant1,
  participant2,
  onClose,
  onSuccess,
}: MatchReportModalProps) {
  const [score1, setScore1] = useState<string>('')
  const [score2, setScore2] = useState<string>('')
  const [claimedWinner, setClaimedWinner] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [screenshotPaths, setScreenshotPaths] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + screenshots.length > 5) {
      alert('Maximum 5 screenshots allowed')
      return
    }
    setScreenshots([...screenshots, ...files])
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index))
    setScreenshotPaths(screenshotPaths.filter((_, i) => i !== index))
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[index]
      return newProgress
    })
  }

  const uploadScreenshots = async (): Promise<string[]> => {
    if (screenshots.length === 0) {
      return []
    }

    setIsUploading(true)
    const paths: string[] = []

    try {
      for (let i = 0; i < screenshots.length; i++) {
        const file = screenshots[i]
        setUploadProgress((prev) => ({ ...prev, [i]: true }))

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(
          `/api/tournaments/${tournamentId}/matches/${match.id}/upload-proof`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload screenshot')
        }

        const data = await response.json()
        paths.push(data.path)
        setUploadProgress((prev) => ({ ...prev, [i]: false }))
      }

      return paths
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!claimedWinner) {
      alert('Please select the winner')
      return
    }

    const score1Num = parseInt(score1, 10)
    const score2Num = parseInt(score2, 10)

    if (isNaN(score1Num) || isNaN(score2Num) || score1Num < 0 || score2Num < 0) {
      alert('Please enter valid scores')
      return
    }

    if (screenshots.length === 0) {
      alert('Please upload at least one screenshot as proof')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload screenshots first
      const paths = await uploadScreenshots()

      // Submit report
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claimed_winner_participant_id: claimedWinner,
            claimed_score1: score1Num,
            claimed_score2: score2Num,
            claimed_method: 'manual',
            notes: notes || undefined,
            proof_paths: paths,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit report')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(error.message || 'Failed to submit match report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getParticipantName = (participant: TournamentParticipant | null) => {
    if (!participant) return 'TBD'
    return participant.profile?.display_name || participant.profile?.username || 'Unknown'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-title text-white">Submit Match Report</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            disabled={isSubmitting || isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Match Info */}
          <div className="border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-sm text-slate-400 mb-2">Match {match.match_number}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white">
                  {getParticipantName(participant1)}
                </span>
                <span className="text-slate-400">VS</span>
                <span className="text-white">
                  {getParticipantName(participant2)}
                </span>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-title text-white mb-2">
                Score for {getParticipantName(participant1)}
              </label>
              <input
                type="number"
                min="0"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                required
                disabled={isSubmitting || isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-title text-white mb-2">
                Score for {getParticipantName(participant2)}
              </label>
              <input
                type="number"
                min="0"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                required
                disabled={isSubmitting || isUploading}
              />
            </div>
          </div>

          {/* Winner Selection */}
          <div>
            <label className="block text-sm font-title text-white mb-2">
              Winner *
            </label>
            <select
              value={claimedWinner}
              onChange={(e) => setClaimedWinner(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
              required
              disabled={isSubmitting || isUploading}
            >
              <option value="">Select winner...</option>
              {participant1 && (
                <option value={participant1.id}>
                  {getParticipantName(participant1)}
                </option>
              )}
              {participant2 && (
                <option value={participant2.id}>
                  {getParticipantName(participant2)}
                </option>
              )}
            </select>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-title text-white mb-2">
              Proof Screenshots * (1-5 images)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isSubmitting || isUploading || screenshots.length >= 5}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || isUploading || screenshots.length >= 5}
              className="w-full border-2 border-dashed border-slate-700 bg-slate-800/30 p-4 text-slate-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-6 h-6 mx-auto mb-2" />
              <span>Click to upload screenshots</span>
            </button>

            {screenshots.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {screenshots.map((file, index) => (
                  <div key={index} className="relative border border-slate-700 bg-slate-800/30">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    {uploadProgress[index] && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      disabled={isSubmitting || isUploading}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-slate-400 p-2 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-title text-white mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
              placeholder="Additional information about the match..."
              disabled={isSubmitting || isUploading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || screenshots.length === 0}
              className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-slate-900 px-4 py-2 font-title uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

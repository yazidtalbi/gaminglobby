'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { TournamentMatch, TournamentMatchReport } from '@/types/tournaments'
import { createClient } from '@/lib/supabase/client'

interface HostFinalizeModalProps {
  match: TournamentMatch
  tournamentId: string
  onClose: () => void
  onSuccess: () => void
}

export function HostFinalizeModal({
  match,
  tournamentId,
  onClose,
  onSuccess,
}: HostFinalizeModalProps) {
  const [reports, setReports] = useState<TournamentMatchReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [winnerId, setWinnerId] = useState<string>('')
  const [score1, setScore1] = useState<string>('')
  const [score2, setScore2] = useState<string>('')
  const [outcomeMethod, setOutcomeMethod] = useState<string>('manual')
  const [outcomeNotes, setOutcomeNotes] = useState<string>('')
  const [proofUrls, setProofUrls] = useState<Record<string, string[]>>({})

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}/report`
      )

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])

        // Fetch signed URLs for proof images
        if (data.reports && data.reports.length > 0) {
          const supabase = createClient()
          const urls: Record<string, string[]> = {}

          for (const report of data.reports) {
            if (report.proof_paths && report.proof_paths.length > 0) {
              const signedUrls: string[] = []
              for (const path of report.proof_paths) {
                const { data: signedData } = await supabase.storage
                  .from('tournament-proofs')
                  .createSignedUrl(path, 3600)

                if (signedData) {
                  signedUrls.push(signedData.signedUrl)
                }
              }
              urls[report.id] = signedUrls
            }
          }
          setProofUrls(urls)
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!winnerId) {
      alert('Please select the winner')
      return
    }

    const score1Num = parseInt(score1, 10)
    const score2Num = parseInt(score2, 10)

    if (isNaN(score1Num) || isNaN(score2Num) || score1Num < 0 || score2Num < 0) {
      alert('Please enter valid scores')
      return
    }

    setIsFinalizing(true)

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}/finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            winner_id: winnerId,
            score1: score1Num,
            score2: score2Num,
            outcome_method: outcomeMethod,
            outcome_notes: outcomeNotes || undefined,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to finalize match')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Finalize error:', error)
      alert(error.message || 'Failed to finalize match')
    } finally {
      setIsFinalizing(false)
    }
  }

  const getParticipantName = (participantId: string | null) => {
    if (!participantId) return 'TBD'
    if (participantId === match.participant1_id) {
      return match.participant1?.profile?.display_name || match.participant1?.profile?.username || 'Participant 1'
    }
    if (participantId === match.participant2_id) {
      return match.participant2?.profile?.display_name || match.participant2?.profile?.username || 'Participant 2'
    }
    return 'Unknown'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-title text-white">Finalize Match</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            disabled={isFinalizing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Match Reports */}
              {reports.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-title text-white mb-4">Submitted Reports</h3>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="border border-slate-700/50 bg-slate-800/30 p-4 overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm text-slate-400">
                              Reported by:{' '}
                              <span className="text-white">
                                {report.reporter?.display_name || report.reporter?.username || 'Unknown'}
                              </span>
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Claimed Winner:{' '}
                              <span className="text-cyan-400">
                                {getParticipantName(report.claimed_winner_participant_id)}
                              </span>
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Score: {report.claimed_score1} - {report.claimed_score2}
                            </p>
                            {report.notes && (
                              <p className="text-sm text-slate-300 mt-2">{report.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Proof Screenshots */}
                        {proofUrls[report.id] && proofUrls[report.id].length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-slate-400 mb-2">Proof Screenshots:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {proofUrls[report.id].map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative group overflow-hidden block"
                                >
                                  <div className="w-full h-32 overflow-hidden border border-slate-700">
                                    <img
                                      src={url}
                                      alt={`Proof ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                                    <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reports.length === 0 && (
                <div className="mb-6 p-4 border border-slate-700/50 bg-slate-800/30 text-center">
                  <p className="text-slate-400">No reports submitted yet</p>
                </div>
              )}

              {/* Finalize Form */}
              <form onSubmit={handleFinalize} className="space-y-4">
                <div className="border-t border-slate-700 pt-6 mt-6">
                  <h3 className="text-lg font-title text-white mb-4">Final Result</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-title text-white mb-2">
                        Score for {getParticipantName(match.participant1_id)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                        required
                        disabled={isFinalizing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-title text-white mb-2">
                        Score for {getParticipantName(match.participant2_id)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                        required
                        disabled={isFinalizing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-title text-white mb-2">
                        Winner *
                      </label>
                      <select
                        value={winnerId}
                        onChange={(e) => setWinnerId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                        required
                        disabled={isFinalizing}
                      >
                        <option value="">Select winner...</option>
                        {match.participant1_id && (
                          <option value={match.participant1_id}>
                            {getParticipantName(match.participant1_id)}
                          </option>
                        )}
                        {match.participant2_id && (
                          <option value={match.participant2_id}>
                            {getParticipantName(match.participant2_id)}
                          </option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-title text-white mb-2">
                        Outcome Method
                      </label>
                      <select
                        value={outcomeMethod}
                        onChange={(e) => setOutcomeMethod(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                        disabled={isFinalizing}
                      >
                        <option value="manual">Manual</option>
                        <option value="forfeit">Forfeit</option>
                        <option value="timeout">Timeout</option>
                        <option value="disconnect">Disconnect</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-title text-white mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={outcomeNotes}
                        onChange={(e) => setOutcomeNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2"
                        placeholder="Additional notes about the match outcome..."
                        disabled={isFinalizing}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isFinalizing}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFinalizing}
                    className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-slate-900 px-4 py-2 font-title uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isFinalizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finalizing...
                      </>
                    ) : (
                      'Finalize Match'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

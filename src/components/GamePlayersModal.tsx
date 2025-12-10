'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, User } from 'lucide-react'
import Link from 'next/link'

interface Player {
  id: string
  username: string
  avatar_url: string | null
  added_at: string
}

interface GamePlayersModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
}

export function GamePlayersModal({ isOpen, onClose, gameId }: GamePlayersModalProps) {
  const supabase = createClient()
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !gameId) return

    const fetchPlayers = async () => {
      setIsLoading(true)
      try {
        // Get all players who added this game to their library
        const { data: userGames, error } = await supabase
          .from('user_games')
          .select(`
            user_id,
            created_at,
            profile:profiles!user_games_user_id_fkey(id, username, avatar_url)
          `)
          .eq('game_id', gameId)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (!userGames || userGames.length === 0) {
          setAllPlayers([])
          setIsLoading(false)
          return
        }

        // Map to Player format
        const allPlayersList: Player[] = userGames
          .map((ug: any) => {
            const profile = ug.profile
            if (!profile) return null

            return {
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatar_url,
              added_at: ug.created_at, // Date they added the game
            }
          })
          .filter((p): p is Player => p !== null)

        setAllPlayers(allPlayersList)
      } catch (error) {
        console.error('Failed to fetch players:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayers()
  }, [isOpen, gameId, supabase])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-cyan-500/30 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
          <h2 className="text-xl font-title text-white">Players</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-title text-slate-400 uppercase mb-3">All Players</h3>
              {allPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm">No players found</p>
              ) : (
                <div className="space-y-2">
                  {allPlayers.map((player) => (
                    <Link
                      key={player.id}
                      href={`/u/${player.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{player.username}</p>
                        <p className="text-xs text-slate-400">
                          Added: {new Date(player.added_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


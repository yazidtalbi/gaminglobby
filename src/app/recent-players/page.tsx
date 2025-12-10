'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types/database'
import { AwardType, getAwardConfig, getAllAwardTypes } from '@/lib/endorsements'
import { OnlineIndicatorDot } from '@/components/OnlineIndicator'
import { Loader2, Award, Check } from 'lucide-react'
import Link from 'next/link'

interface RecentPlayer extends Profile {
  last_encountered_at: string
  lobby_id: string | null
  existing_endorsements?: AwardType[]
}

export default function RecentPlayersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [players, setPlayers] = useState<RecentPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [endorsingPlayerId, setEndorsingPlayerId] = useState<string | null>(null)
  const [selectedAward, setSelectedAward] = useState<AwardType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchRecentPlayers()
  }, [user, router])

  const fetchRecentPlayers = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Fetch recent players
      const { data: recentPlayersData } = await supabase
        .from('recent_players')
        .select(`
          encountered_player_id,
          last_encountered_at,
          lobby_id,
          profile:profiles!recent_players_encountered_player_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('last_encountered_at', { ascending: false })
        .limit(50)

      if (!recentPlayersData) {
        setIsLoading(false)
        return
      }

      // Fetch existing endorsements for each player
      const playersWithEndorsements = await Promise.all(
        recentPlayersData.map(async (rp) => {
          const profile = rp.profile as unknown as Profile
          
          // Get existing endorsements given by current user
          const { data: endorsements } = await supabase
            .from('player_endorsements')
            .select('award_type')
            .eq('player_id', profile.id)
            .eq('endorsed_by', user.id)

          return {
            ...profile,
            last_encountered_at: rp.last_encountered_at,
            lobby_id: rp.lobby_id,
            existing_endorsements: endorsements?.map((e) => e.award_type) || [],
          } as RecentPlayer
        })
      )

      setPlayers(playersWithEndorsements)
    } catch (err) {
      console.error('Failed to fetch recent players:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndorse = async (playerId: string, awardType: AwardType) => {
    if (!user || !selectedAward) return

    setIsSubmitting(true)
    try {
      // Check if endorsement already exists
      const { data: existing } = await supabase
        .from('player_endorsements')
        .select('id')
        .eq('player_id', playerId)
        .eq('endorsed_by', user.id)
        .eq('award_type', awardType)
        .single()

      if (existing) {
        // Remove endorsement if it already exists (toggle off)
        await supabase
          .from('player_endorsements')
          .delete()
          .eq('id', existing.id)
      } else {
        // Add new endorsement
        await supabase.from('player_endorsements').insert({
          player_id: playerId,
          endorsed_by: user.id,
          award_type: awardType,
        })
      }

      // Refresh the list
      await fetchRecentPlayers()
      setEndorsingPlayerId(null)
      setSelectedAward(null)
    } catch (err) {
      console.error('Failed to endorse player:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-app-green-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Recent Players</h1>
          <p className="text-slate-400">
            Players you've encountered in lobbies. Give them endorsements for positive experiences.
          </p>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No recent players yet. Join a lobby to start meeting players!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player) => {
              const isEndorsing = endorsingPlayerId === player.id
              const awardConfigs = getAllAwardTypes().map((type) => getAwardConfig(type))
              const hasEndorsement = player.existing_endorsements && player.existing_endorsements.length > 0

              return (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors"
                >
                  {/* Avatar */}
                  <Link href={`/u/${player.id}`} className="flex-shrink-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-700">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-app-green-500 to-cyan-500" />
                      )}
                      <OnlineIndicatorDot lastActiveAt={player.last_active_at} size="sm" />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/u/${player.id}`} className="block">
                      <p className="font-medium text-white truncate">{player.username}</p>
                      <p className="text-sm text-slate-400">
                        Encountered {new Date(player.last_encountered_at).toLocaleDateString()}
                      </p>
                    </Link>

                    {/* Existing Endorsements */}
                    {hasEndorsement && (
                      <div className="flex items-center gap-2 mt-2">
                        {player.existing_endorsements!.map((awardType) => {
                          const config = getAwardConfig(awardType)
                          return (
                            <div
                              key={awardType}
                              className="flex items-center gap-1 px-2 py-0.5 bg-app-green-500/20 border border-app-green-500/30 rounded text-xs text-app-green-400"
                            >
                              <span>{config.emoji}</span>
                              <span>{config.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Endorse Button */}
                  <div className="flex-shrink-0 relative">
                    {!isEndorsing ? (
                      <button
                        onClick={() => setEndorsingPlayerId(player.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Award className="w-4 h-4" />
                        {hasEndorsement ? 'Edit' : 'Endorse'}
                      </button>
                    ) : (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-2">
                        <div className="text-xs text-slate-400 mb-2 px-2">Select an award:</div>
                        <div className="space-y-1">
                          {awardConfigs.map((config) => {
                            const isSelected = selectedAward === config.type
                            const alreadyGiven = player.existing_endorsements?.includes(config.type)

                            return (
                              <button
                                key={config.type}
                                onClick={() => {
                                  setSelectedAward(config.type)
                                  handleEndorse(player.id, config.type)
                                }}
                                disabled={isSubmitting}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                  isSelected || alreadyGiven
                                    ? 'bg-app-green-500/20 border border-app-green-500/30 text-app-green-400'
                                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                                } disabled:opacity-50`}
                              >
                                <span className="text-base">{config.emoji}</span>
                                <span className="flex-1 text-left">{config.label}</span>
                                {alreadyGiven && (
                                  <Check className="w-4 h-4 text-app-green-400" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <button
                          onClick={() => {
                            setEndorsingPlayerId(null)
                            setSelectedAward(null)
                          }}
                          className="w-full mt-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


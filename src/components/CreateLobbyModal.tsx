'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GameGuide } from '@/types/database'
import { X, Loader2, Monitor, Gamepad, BookOpen } from 'lucide-react'

interface CreateLobbyModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  gameName: string
  userId: string
  onLobbyCreated?: (lobbyId: string) => void
}

const platforms = [
  { value: 'pc', label: 'PC', icon: Monitor },
  { value: 'ps', label: 'PlayStation', icon: Gamepad },
  { value: 'xbox', label: 'Xbox', icon: Gamepad },
  { value: 'switch', label: 'Switch', icon: Gamepad },
  { value: 'mobile', label: 'Mobile', icon: Gamepad },
  { value: 'other', label: 'Other', icon: Gamepad },
] as const

export function CreateLobbyModal({
  isOpen,
  onClose,
  gameId,
  gameName,
  userId,
  onLobbyCreated,
}: CreateLobbyModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState<'pc' | 'ps' | 'xbox' | 'switch' | 'mobile' | 'other'>('pc')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [discordLink, setDiscordLink] = useState('')
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [guides, setGuides] = useState<GameGuide[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [existingLobbyInfo, setExistingLobbyInfo] = useState<{ id: string; title: string } | null>(null)
  const supabase = createClient()

  // Fetch guides for this game
  useEffect(() => {
    if (!isOpen) return

    const fetchGuides = async () => {
      const { data } = await supabase
        .from('game_guides')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })

      if (data) {
        setGuides(data)
      }
    }

    fetchGuides()
  }, [isOpen, gameId, supabase])

  if (!isOpen) return null

  const handleCloseExistingLobbies = async () => {
    // Close any existing lobbies the user is hosting
    const { data: existingLobbies } = await supabase
      .from('lobbies')
      .select('id, title')
      .eq('host_id', userId)
      .in('status', ['open', 'in_progress'])

    if (existingLobbies && existingLobbies.length > 0) {
      // Close all existing lobbies
      await supabase
        .from('lobbies')
        .update({ status: 'closed' })
        .eq('host_id', userId)
        .in('status', ['open', 'in_progress'])
    }

    // Leave any lobbies the user is a member of
    const { data: existingMembership } = await supabase
      .from('lobby_members')
      .select(`
        id,
        lobby:lobbies!inner(id, status)
      `)
      .eq('user_id', userId)

    const activeMemberships = existingMembership?.filter(
      (m) => {
        const lobby = m.lobby as unknown as { status: string }
        return lobby.status === 'open' || lobby.status === 'in_progress'
      }
    )

    if (activeMemberships && activeMemberships.length > 0) {
      // Remove user from all active lobbies
      const membershipIds = activeMemberships.map((m) => m.id)
      await supabase
        .from('lobby_members')
        .delete()
        .in('id', membershipIds)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check if user has existing lobbies
    const { data: existingLobbies } = await supabase
      .from('lobbies')
      .select('id, title')
      .eq('host_id', userId)
      .in('status', ['open', 'in_progress'])
      .limit(1)

    const { data: existingMembership } = await supabase
      .from('lobby_members')
      .select(`
        id,
        lobby:lobbies!inner(id, status, title)
      `)
      .eq('user_id', userId)
      .limit(10)

    const activeMembership = existingMembership?.find(
      (m) => {
        const lobby = m.lobby as unknown as { status: string }
        return lobby.status === 'open' || lobby.status === 'in_progress'
      }
    )

    // If user has existing lobby, show warning
    if ((existingLobbies && existingLobbies.length > 0) || activeMembership) {
      const lobbyTitle = existingLobbies?.[0]?.title || (activeMembership?.lobby as unknown as { title: string })?.title || 'your current lobby'
      setExistingLobbyInfo({ id: existingLobbies?.[0]?.id || '', title: lobbyTitle })
      setShowCloseWarning(true)
      return
    }

    // Proceed with creation if no existing lobby
    await createLobby()
  }

  const createLobby = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Close existing lobbies first
      await handleCloseExistingLobbies()

      // Create lobby
      const { data: lobby, error: insertError } = await supabase
        .from('lobbies')
        .insert({
          host_id: userId,
          game_id: gameId,
          game_name: gameName,
          title,
          description: description || null,
          platform,
          max_players: maxPlayers ? parseInt(maxPlayers, 10) : null,
          discord_link: discordLink || null,
          featured_guide_id: selectedGuideId,
          status: 'open',
          host_last_active_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Automatically add game to user's library if not already present
      try {
        const { data: existingGames, error: checkError } = await supabase
          .from('user_games')
          .select('id')
          .eq('user_id', userId)
          .eq('game_id', gameId)
          .limit(1)

        // If no existing game found, add it to library
        if (!checkError && (!existingGames || existingGames.length === 0)) {
          const { error: insertError } = await supabase.from('user_games').insert({
            user_id: userId,
            game_id: gameId,
            game_name: gameName,
          })

          if (insertError) {
            console.log('Could not auto-add game to library:', insertError)
          }
        }
      } catch (error) {
        // Silently fail - this is non-critical, so we don't want to block lobby creation
        console.log('Could not auto-add game to library:', error)
      }

      onLobbyCreated?.(lobby.id)
      onClose()

      // Reset form
      setTitle('')
      setDescription('')
      setPlatform('pc')
      setMaxPlayers('')
      setDiscordLink('')
      setSelectedGuideId(null)
      setShowCloseWarning(false)
      setExistingLobbyInfo(null)
    } catch (err) {
      console.error('Failed to create lobby:', err)
      setError('Failed to create lobby. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmClose = async () => {
    setShowCloseWarning(false)
    await createLobby()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Create Lobby</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Game */}
          <div className="text-sm text-slate-400">
            Creating lobby for: <span className="text-white font-medium">{gameName}</span>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Lobby Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ranked grind, chill vibes"
              required
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Platform *</label>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlatform(value)}
                  className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-colors
                    ${platform === value
                      ? 'bg-app-green-600/20 border-app-green-500/50 text-app-green-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the plan? What are you looking for?"
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50 resize-none"
            />
          </div>

          {/* Max Players */}
          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-slate-300 mb-2">
              Max Players (optional)
            </label>
            <input
              id="maxPlayers"
              type="number"
              min="2"
              max="100"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
            />
          </div>

          {/* Discord Link */}
          <div>
            <label htmlFor="discordLink" className="block text-sm font-medium text-slate-300 mb-2">
              Discord Link (optional)
            </label>
            <input
              id="discordLink"
              type="url"
              value={discordLink}
              onChange={(e) => setDiscordLink(e.target.value)}
              placeholder="https://discord.gg/..."
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
            />
          </div>

          {/* Attach Guide */}
          {guides.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Attach a Guide (optional)
                </div>
              </label>
              <select
                value={selectedGuideId || ''}
                onChange={(e) => setSelectedGuideId(e.target.value || null)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-app-green-500/50 focus:border-app-green-500/50"
              >
                <option value="">No guide</option>
                {guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Helpful for new players joining your lobby
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </p>
          )}

          {/* Warning Modal */}
          {showCloseWarning && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Close Existing Lobby?</h3>
                </div>
                <div className="p-4">
                  <p className="text-slate-300 mb-4">
                    You are already in an active lobby: <span className="font-medium text-white">{existingLobbyInfo?.title}</span>
                  </p>
                  <p className="text-slate-400 text-sm mb-4">
                    Creating a new lobby will close your current lobby. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCloseWarning(false)
                        setExistingLobbyInfo(null)
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmClose}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Close & Create New'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !title || showCloseWarning}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-app-green-600 hover:bg-app-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Lobby...
              </>
            ) : (
              'Create Lobby'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}


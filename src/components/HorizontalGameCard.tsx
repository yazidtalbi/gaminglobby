'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Gamepad2, Plus, Loader2, Bookmark, Check, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { generateSlug } from '@/lib/slug'
import { createClient } from '@/lib/supabase/client'
import { CreateLobbyModal } from '@/components/CreateLobbyModal'

interface HorizontalGameCardProps {
  gameId: string
  gameName: string
  gameCoverUrl: string | null
  totalPlayers: number
  onlinePlayers: number
  searchCount?: number
  lobbiesCount?: number
}

export function HorizontalGameCard({
  gameId,
  gameName,
  gameCoverUrl,
  totalPlayers,
  searchCount = 0,
  lobbiesCount = 0,
}: HorizontalGameCardProps) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()
  
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)
  const [isQuickMatching, setIsQuickMatching] = useState(false)
  const [showCreateLobby, setShowCreateLobby] = useState(false)

  // Handler to redirect to login if user is not authenticated
  const requireAuth = useCallback((action: () => void) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    action()
  }, [user, router])

  // Check if game is in user's library
  useEffect(() => {
    if (!user || !gameId) return

    const checkLibraryStatus = async () => {
      const { data } = await supabase
        .from('user_games')
        .select('id')
        .eq('user_id', user.id)
        .eq('game_id', gameId.toString())
        .single()

      setIsInLibrary(!!data)
    }

    checkLibraryStatus()
  }, [user, gameId, supabase])

  const handleToggleLibrary = async () => {
    if (!user || !gameId || isAddingToLibrary) return

    setIsAddingToLibrary(true)

    try {
      if (isInLibrary) {
        const { error: deleteError } = await supabase
          .from('user_games')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', gameId.toString())

        if (deleteError) {
          console.error('Failed to remove game:', deleteError)
        } else {
          setIsInLibrary(false)
          window.dispatchEvent(new CustomEvent('libraryUpdated'))
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_games')
          .insert({
            user_id: user.id,
            game_id: gameId.toString(),
            game_name: gameName,
          })

        if (insertError) {
          if (insertError.code === '23505') {
            setIsInLibrary(true)
          } else {
            console.error('Failed to add game:', insertError)
          }
        } else {
          setIsInLibrary(true)
          window.dispatchEvent(new CustomEvent('libraryUpdated'))
        }
      }
    } catch (err) {
      console.error('Failed to toggle game in library:', err)
    } finally {
      setIsAddingToLibrary(false)
    }
  }

  const handleQuickMatch = async () => {
    if (!user || !gameId || !profile || isQuickMatching) return

    setIsQuickMatching(true)

    try {
      const preferredPlatform = (profile as any)?.preferred_platform || 'pc'

      const response = await fetch('/api/lobbies/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId.toString(),
          gameName,
          platform: preferredPlatform,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Failed to create lobby:', data.error)
        return
      }

      if (data.lobbyId) {
        router.push(`/lobbies/${data.lobbyId}`)
      }
    } catch (err) {
      console.error('Failed to quick match:', err)
    } finally {
      setIsQuickMatching(false)
    }
  }

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 p-6 flex flex-col">
        {/* Top Section: Image, Name, and Stats */}
        <div className="flex gap-0 mb-6">
          {/* Game Image - Left Side (Smaller, not cropped) */}
          <Link 
            href={`/games/${generateSlug(gameName)}`}
            className="w-16 h-20 flex-shrink-0 overflow-hidden bg-slate-700/50 border border-slate-600/50 hover:border-cyan-500/50 transition-colors flex items-center justify-center"
          >
            {gameCoverUrl ? (
              <img 
                src={gameCoverUrl} 
                alt={gameName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-slate-600" />
              </div>
            )}
          </Link>

          {/* Game Info - Right Side */}
          <div className="flex-1 flex flex-col min-w-0 pl-6">
            {/* Game Title */}
            <Link href={`/games/${generateSlug(gameName)}`} className="mb-4">
              <h3 className="font-title text-white text-xl hover:text-cyan-400 transition-colors truncate">
                {gameName}
              </h3>
            </Link>

            {/* Stats Section */}
            <div className="flex items-center w-full border border-slate-600/30">
              <button
                onClick={() => router.push(`/games/${generateSlug(gameName)}`)}
                className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-1 border-r border-slate-600/30 py-2"
              >
                <span className="text-sm text-cyan-400 uppercase font-title">{totalPlayers.toLocaleString()}</span>
                <span className="text-sm text-white uppercase font-title">PLAYERS</span>
              </button>
              <div className="flex items-center justify-center gap-2 flex-1 border-r border-slate-600/30 py-2">
                <span className="text-sm text-cyan-400 uppercase font-title">{searchCount.toLocaleString()}</span>
                <span className="text-sm text-white uppercase font-title">SEARCHES</span>
              </div>
              <div className="flex items-center justify-center gap-2 flex-1 py-2">
                <span className="text-sm text-cyan-400 uppercase font-title">{lobbiesCount}</span>
                <span className="text-sm text-white uppercase font-title">LOBBIES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Buttons in Horizontal Row */}
        <div className="mt-auto">
          <div className="border-t border-cyan-500/30 mb-4" />

          <div className="flex gap-3">
            {/* IN LIBRARY / ADD TO LIBRARY Button */}
            <button
              onClick={() => requireAuth(() => handleToggleLibrary())}
              disabled={isAddingToLibrary}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 font-title text-sm transition-colors relative ${
                isInLibrary
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-fuchsia-400'
                  : 'bg-slate-700/50 hover:bg-slate-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
              }`}
            >
              <span className={`absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
              <span className={`absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
              <span className={`absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
              <span className={`absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r ${isInLibrary ? 'border-fuchsia-400' : 'border-white'}`} />
              <span className="relative z-10 flex items-center gap-2">
                {isAddingToLibrary ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isInLibrary ? 'Removing...' : 'Adding...'}
                  </>
                ) : isInLibrary ? (
                  <>
                    <Check className="w-4 h-4" />
                    IN LIBRARY
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    ADD TO LIBRARY
                  </>
                )}
              </span>
            </button>

            {/* CREATE LOBBY Button */}
            <button
              onClick={() => requireAuth(() => setShowCreateLobby(true))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-lime-400 font-title text-sm transition-colors relative"
            >
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                CREATE LOBBY
              </span>
            </button>

            {/* Quick Match Button (Lightning Bolt) */}
            <button
              onClick={() => requireAuth(() => handleQuickMatch())}
              disabled={isQuickMatching}
              className="flex items-center justify-center px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-lime-400 font-title text-sm transition-colors relative"
            >
              <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-lime-400" />
              <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-lime-400" />
              <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-lime-400" />
              <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-lime-400" />
              <span className="relative z-10">
                {isQuickMatching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {user && profile && (
        <CreateLobbyModal
          isOpen={showCreateLobby}
          onClose={() => setShowCreateLobby(false)}
          gameId={gameId.toString()}
          gameName={gameName}
          userId={user.id}
          onLobbyCreated={(lobbyId) => {
            router.push(`/lobbies/${lobbyId}`)
          }}
        />
      )}
    </>
  )
}


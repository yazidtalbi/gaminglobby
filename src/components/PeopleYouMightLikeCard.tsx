'use client'

import { FollowButton } from './FollowButton'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Avatar } from './Avatar'
import { Gamepad2 } from 'lucide-react'

interface PeopleYouMightLikeCardProps {
  person: {
    id: string
    username: string
    display_name?: string | null
    avatar_url: string | null
    bio?: string | null
    mutual_games: number
    mutual_games_data?: Array<{
      gameId: string
      gameName: string
      squareIconUrl: string | null
      bannerCoverUrl: string | null
    }>
    banner_cover_url?: string | null
    suggestion_reason: 'both' | 'recent' | 'similar'
    plan_tier?: string | null
    plan_expires_at?: string | null
  }
}

export function PeopleYouMightLikeCard({ person }: PeopleYouMightLikeCardProps) {
  const { user } = useAuth()

  const isPro = (person.plan_tier === 'pro' && 
    (!person.plan_expires_at || new Date(person.plan_expires_at) > new Date())) ||
    person.plan_tier === 'founder'
  const isFounder = person.plan_tier === 'founder'

  const getSuggestionLines = () => {
    if (person.suggestion_reason === 'both') {
      return {
        firstLine: `${person.mutual_games} mutual ${person.mutual_games === 1 ? 'game' : 'games'}`,
        secondLine: 'Recently played together'
      }
    } else if (person.suggestion_reason === 'recent') {
      return {
        firstLine: null,
        secondLine: 'Recently played together'
      }
    } else {
      return {
        firstLine: `${person.mutual_games} mutual ${person.mutual_games === 1 ? 'game' : 'games'}`,
        secondLine: null
      }
    }
  }

  const suggestionLines = getSuggestionLines()
  const mutualGamesData = person.mutual_games_data || []

  return (
    <div className="relative bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all overflow-hidden group">
      {/* Content Section */}
      <div className="relative z-10 p-4 flex flex-col h-full min-h-[280px]">
        {/* Avatar - Top left */}
        <div className="relative mb-4 z-0 flex-shrink-0">
          <Link href={`/u/${person.username}`} className="inline-block">
            <Avatar
              key={`avatar-${person.id}-${person.avatar_url}`} // Force remount on refresh
              src={person.avatar_url}
              alt={person.display_name || person.username}
              username={person.username}
              size="lg"
              showBorder
              borderColor={isFounder ? 'founder' : isPro ? 'pro' : 'default'}
              className="transition-colors hover:border-cyan-400"
            />
          </Link>
        </div>

        {/* Profile Info - Beneath avatar */}
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Display Name and Username */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link href={`/u/${person.username}`}>
                <h3 className={`font-title text-lg font-semibold transition-colors ${
                  isFounder ? 'text-purple-400' : isPro ? 'text-yellow-400' : 'text-white'
                } hover:opacity-80`}>
                  {person.display_name || person.username}
                </h3>
              </Link>
              {isFounder && (
                <span className="px-1 py-0 bg-purple-500 text-white text-xs font-title font-bold uppercase flex items-center gap-1">
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-white"></div>
                  FOUNDER
                </span>
              )}
              {isPro && !isFounder && (
                <span className="px-1 py-0 bg-amber-400 text-slate-900 text-xs font-title font-bold uppercase flex items-center gap-1">
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-slate-900"></div>
                  APEX
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {person.bio && (
            <p className="text-sm text-slate-300 line-clamp-2 max-w-xs">
              {person.bio}
            </p>
          )}

          {/* Mutual Games Grid - Square Icons - Pushed to bottom */}
          {mutualGamesData.length > 0 && (
            <div className="mt-auto pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  {person.mutual_games} {person.mutual_games === 1 ? 'mutual game' : 'mutual games'}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-0.5">
                {mutualGamesData.slice(0, 4).map((game, idx) => (
                  <Link
                    key={game.gameId || idx}
                    href={`/games/${game.gameId}`}
                    className="relative aspect-square rounded overflow-hidden border border-slate-700/50"
                  >
                    {game.squareIconUrl ? (
                      <img
                        src={game.squareIconUrl}
                        alt={game.gameName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700/50 flex items-center justify-center">
                        <Gamepad2 className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Follow Button - Top Right */}
        {user && user.id !== person.id && (
          <div className="absolute top-4 right-4 z-20">
            <FollowButton
              targetUserId={person.id}
              currentUserId={user.id}
              initialIsFollowing={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}


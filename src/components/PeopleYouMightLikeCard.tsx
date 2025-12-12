'use client'

import { FollowButton } from './FollowButton'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface PeopleYouMightLikeCardProps {
  person: {
    id: string
    username: string
    avatar_url: string | null
    mutual_games: number
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

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-colors p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Link href={`/u/${person.username}`} className="flex-shrink-0">
          <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-colors ${
            isFounder
              ? 'border-purple-400 hover:border-purple-300'
              : isPro 
                ? 'border-yellow-400 hover:border-yellow-300' 
                : 'border-slate-600 hover:border-cyan-400'
          }`}>
            {person.avatar_url ? (
              <img
                src={person.avatar_url}
                alt={person.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                <span className="text-lg text-slate-400 font-title">
                  {person.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Username with Apex Badge */}
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/u/${person.username}`}>
              <h3 className="font-title text-white hover:text-cyan-400 transition-colors text-base">
                {person.username}
              </h3>
            </Link>
            {isPro && (
              <span className="px-1 py-0 bg-amber-400 text-slate-900 text-xs font-title font-bold uppercase flex items-center gap-1">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-slate-900"></div>
                APEX
              </span>
            )}
          </div>

          {/* Suggestion Reason - Two Lines */}
          <div className="text-xs text-slate-400">
            {suggestionLines.firstLine && (
              <p>{suggestionLines.firstLine}</p>
            )}
            {suggestionLines.secondLine && (
              <p className={suggestionLines.firstLine ? 'mt-0.5' : ''}>{suggestionLines.secondLine}</p>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {user && user.id !== person.id && (
          <div className="flex-shrink-0">
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


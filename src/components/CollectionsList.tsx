'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { PremiumLockOverlay } from './PremiumLockOverlay'
import { Collection } from '@/types/database'
import Link from 'next/link'
import { Add, Lock } from '@mui/icons-material'

interface CollectionsListProps {
  userId: string
  isOwnProfile?: boolean
}

export function CollectionsList({ userId, isOwnProfile = false }: CollectionsListProps) {
  const { user } = useAuth()
  const { isPro } = usePremium()
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`/api/collections?user_id=${userId}&include_public=${!isOwnProfile}`)
        const data = await response.json()
        setCollections(data.collections || [])
      } catch (error) {
        console.error('Error fetching collections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollections()
  }, [userId, isOwnProfile])

  if (isLoading) {
    return <div className="text-slate-400">Loading collections...</div>
  }

  const canCreate = isOwnProfile && user?.id === userId && isPro

  return (
    <div className="relative">
      {!canCreate && isOwnProfile && (
        <PremiumLockOverlay feature="collections" />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-title text-white">Collections</h2>
        {canCreate && (
          <button
            onClick={() => {
              // Create a new collection via API
              const createCollection = async () => {
                try {
                  const response = await fetch('/api/collections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: 'New Collection',
                      description: '',
                      is_public: false,
                      is_pinned: false,
                    }),
                  })
                  const data = await response.json()
                  if (data.collection) {
                    window.location.href = `/u/${userId}/collections/${data.collection.id}`
                  }
                } catch (error) {
                  console.error('Error creating collection:', error)
                }
              }
              createCollection()
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-title text-sm transition-colors relative"
          >
            {/* Corner brackets */}
            <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white" />
            <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-white" />
            <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-white" />
            <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white" />
            <span className="relative z-10">
              &gt; ADD COLLECTION
            </span>
          </button>
        )}
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          {isOwnProfile ? (
            <>
              {!isPro ? (
                <>
                  <Lock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="mb-4">Collections are a Pro feature</p>
                  <Link
                    href="/billing"
                    className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors"
                  >
                    Upgrade to Pro
                  </Link>
                </>
              ) : (
                <p>No collections yet. Create your first one!</p>
              )}
            </>
          ) : (
            <p>No public collections</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/u/${userId}/collections/${collection.id}`}
              className="bg-slate-800 border border-slate-700 p-4 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-title text-lg">{collection.title}</h3>
                {collection.is_pinned && (
                  <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-1 font-title">PINNED</span>
                )}
              </div>
              {collection.description && (
                <p className="text-slate-400 text-sm mb-2 line-clamp-2">{collection.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {collection.is_public ? (
                  <span>Public</span>
                ) : (
                  <span>Private</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


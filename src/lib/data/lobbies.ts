/**
 * Lobby data fetchers
 */

import { createPublicSupabaseClient } from '@/lib/supabase/server'

export interface LobbyData {
  id: string
  gameName?: string
  isPublic: boolean
  updatedAt?: string
}

/**
 * Get lobby by ID
 */
export async function getLobbyById(id: string): Promise<LobbyData | null> {
  const supabase = createPublicSupabaseClient()
  
  const { data, error } = await supabase
    .from('lobbies')
    .select('id, game_name, visibility, updated_at')
    .eq('id', id)
    .single()
  
  if (error || !data) return null
  
  return {
    id: data.id,
    gameName: data.game_name,
    isPublic: data.visibility === 'public' || data.visibility === null,
    updatedAt: data.updated_at,
  }
}

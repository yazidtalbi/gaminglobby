/**
 * Lobby data fetchers
 * TODO: Connect to Supabase
 */

export interface LobbyData {
  id: string
  gameName?: string
  isPublic: boolean
  updatedAt?: string
}

/**
 * Get lobby by ID
 */
export async function getLobbyById(_id: string): Promise<LobbyData | null> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('lobbies')
  //   .select('id, game_name, is_public, updated_at')
  //   .eq('id', id)
  //   .single()
  
  // if (!data) return null
  
  // return {
  //   id: data.id,
  //   gameName: data.game_name,
  //   isPublic: data.is_public ?? true,
  //   updatedAt: data.updated_at,
  // }
  
  return null
}

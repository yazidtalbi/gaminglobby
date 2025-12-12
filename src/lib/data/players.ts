/**
 * Player data fetchers
 * TODO: Connect to Supabase
 */

export interface PlayerData {
  username: string
  displayName?: string
  isPublic: boolean
  updatedAt?: string
}

/**
 * Get player by username
 */
export async function getPlayerByUsername(username: string): Promise<PlayerData | null> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('profiles')
  //   .select('username, display_name, is_private, updated_at')
  //   .eq('username', username)
  //   .single()
  
  // if (!data) return null
  
  // return {
  //   username: data.username,
  //   displayName: data.display_name,
  //   isPublic: !data.is_private,
  //   updatedAt: data.updated_at,
  // }
  
  return null
}

/**
 * Sitemap data fetchers
 * 
 * TODO: Connect to Supabase to fetch real data
 */

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

/**
 * Get all games for sitemap
 * TODO: Fetch from Supabase
 */
export async function getSitemapGames(): Promise<SitemapEntry[]> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('games')
  //   .select('slug, updated_at')
  //   .eq('is_active', true)
  
  // return data?.map(game => ({
  //   url: `/games/${game.slug}`,
  //   lastModified: game.updated_at ? new Date(game.updated_at) : undefined,
  //   changeFrequency: 'daily' as const,
  //   priority: 0.8,
  // })) ?? []
  
  return []
}

/**
 * Get all public player profiles for sitemap
 * TODO: Fetch from Supabase
 */
export async function getSitemapPlayers(): Promise<SitemapEntry[]> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('profiles')
  //   .select('username, updated_at')
  //   .eq('is_private', false)
  
  // return data?.map(profile => ({
  //   url: `/u/${profile.username}`,
  //   lastModified: profile.updated_at ? new Date(profile.updated_at) : undefined,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // })) ?? []
  
  return []
}

/**
 * Get all public lobbies for sitemap
 * TODO: Fetch from Supabase
 */
export async function getSitemapLobbies(): Promise<SitemapEntry[]> {
  // TODO: Implement Supabase query
  // const { data } = await supabase
  //   .from('lobbies')
  //   .select('id, updated_at')
  //   .eq('status', 'open')
  //   .eq('is_public', true)
  
  // return data?.map(lobby => ({
  //   url: `/lobbies/${lobby.id}`,
  //   lastModified: lobby.updated_at ? new Date(lobby.updated_at) : undefined,
  //   changeFrequency: 'hourly' as const,
  //   priority: 0.7,
  // })) ?? []
  
  return []
}

/**
 * Game data fetchers
 * TODO: Connect to Supabase
 */

export interface GameData {
  name: string
  slug: string
  coverUrl?: string
  updatedAt?: string
}

/**
 * Get game by slug or ID
 */
export async function getGameBySlug(slugOrId: string): Promise<GameData | null> {
  // TODO: Implement Supabase query
  // First try as ID (number), then as slug
  // const isNumeric = /^\d+$/.test(slugOrId)
  // 
  // if (isNumeric) {
  //   const { data } = await supabase
  //     .from('games')
  //     .select('name, slug, cover_url, updated_at')
  //     .eq('id', parseInt(slugOrId, 10))
  //     .single()
  //   
  //   if (data) {
  //     return {
  //       name: data.name,
  //       slug: data.slug,
  //       coverUrl: data.cover_url,
  //       updatedAt: data.updated_at,
  //     }
  //   }
  // }
  // 
  // const { data } = await supabase
  //   .from('games')
  //   .select('name, slug, cover_url, updated_at')
  //   .eq('slug', slugOrId)
  //   .single()
  // 
  // if (!data) return null
  // 
  // return {
  //   name: data.name,
  //   slug: data.slug,
  //   coverUrl: data.cover_url,
  //   updatedAt: data.updated_at,
  // }
  
  return null
}

import { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const idOrUsername = params.id
  
  // Fetch profile from Supabase
  const supabase = await createServerSupabaseClient()
  
  // Check if it's a UUID (ID) or username
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername)
  const query = isUUID
    ? supabase.from('profiles').select('username, display_name, is_private').eq('id', idOrUsername)
    : supabase.from('profiles').select('username, display_name, is_private').eq('username', idOrUsername)
  
  const { data: profileData } = await query.single()

  if (!profileData) {
    return createMetadata({
      title: `${idOrUsername}'s profile`,
      description: 'View player profile, games, lobbies, and matchmaking activity on APOXER.COM.',
      path: `/u/${idOrUsername}`,
    })
  }

  const displayName = profileData.display_name || profileData.username
  const username = profileData.username
  const title = `${username}'s profile`
  const description = `View ${displayName}'s games, lobbies, and matchmaking activity on APOXER.COM.`
  const isPublic = !profileData.is_private

  return createMetadata({
    title,
    description,
    path: `/u/${profileData.username}`,
    noIndex: !isPublic,
  })
}

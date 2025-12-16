import { NextResponse } from 'next/server'
import { searchGames, getGameById, getSquareCover } from '@/lib/steamgriddb'

// Fetch hero image for a game (for banners)
async function getGameHero(gameId: number): Promise<{ url: string | null; thumb: string | null }> {
  try {
    const STEAMGRIDDB_API_BASE = process.env.STEAMGRIDDB_API_BASE || 'https://www.steamgriddb.com/api/v2'
    const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY || ''
    
    if (!STEAMGRIDDB_API_KEY) {
      return { url: null, thumb: null }
    }
    
    const response = await fetch(
      `${STEAMGRIDDB_API_BASE}/heroes/game/${gameId}`,
      {
        headers: {
          Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    )
    
    if (!response.ok) {
      return { url: null, thumb: null }
    }
    
    const data = await response.json()
    const heroes = (data.data || []) as Array<{ url: string; thumb: string; nsfw: boolean; epilepsy: boolean }>
    
    // Filter out NSFW and epilepsy content, get first hero
    const filteredHeroes = heroes.filter((hero) => !hero.nsfw && !hero.epilepsy)
    
    if (filteredHeroes.length > 0) {
      return {
        url: filteredHeroes[0].url || null,
        thumb: filteredHeroes[0].thumb || null,
      }
    }
    
    return { url: null, thumb: null }
  } catch (error) {
    console.error('Hero fetch error:', error)
    return { url: null, thumb: null }
  }
}

// Create Supabase client function to avoid module-level initialization issues
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Classic games to seed from (organized by category)
// The function will search for these by name if IDs aren't available
const CLASSIC_GAMES = [
  // Classic / Arena FPS
  'DOOM (1993)',
  'Duke Nukem 3D',
  'Quake',
  'Quake II',
  'Quake III Arena',
  'Unreal Tournament (1999)',
  'Unreal Tournament 2004',
  'Serious Sam: The First Encounter',
  'Serious Sam: The Second Encounter',
  'Wolfenstein: Enemy Territory',
  'Return to Castle Wolfenstein',
  'XIII',
  
  // Military / Tactical Shooters
  'Battlefield 1942',
  'Battlefield 1',
  'Battlefield 3',
  'Battlefield: Bad Company 2',
  'Call of Duty 2',
  'Call of Duty 4: Modern Warfare',
  'Call of Duty: Black Ops',
  'Counter-Strike 1.6',
  'Medal of Honor: Allied Assault',
  'Red Orchestra: Ostfront 41–45',
  
  // Action / Shooter Multiplayer
  'Team Fortress 2',
  'Max Payne 3',
  'Grand Theft Auto IV',
  'Grand Theft Auto: Vice City',
  'Red Dead Redemption 2',
  'James Bond 007: Nightfire',
  'James Bond 007: Everything or Nothing',
  '007: Agent Under Fire',
  
  // Arcade / Retro Multiplayer
  'Jazz Jackrabbit 2',
  'Streets of Rage 2',
  'Streets of Rage 4',
  'Ridge Racer 2',
  'TrackMania Nations Forever',
  'FlatOut 2',
  'Burnout Paradise',
  'Need for Speed: Most Wanted',
  
  // Fighting / Versus Games
  'Naruto Shippuden: Ultimate Ninja 5',
  'Tekken 5',
  'SoulCalibur II',
  'WWE SmackDown vs. Raw 2010',
  'Crash Team Racing',
  'Mario Kart: Double Dash',
  
  // RPG / MMO
  'World of Warcraft',
  'Diablo II',
  'Guild Wars',
  'Ragnarok Online',
  'Lineage II',
  
  // Strategy / LAN Classics
  'Age of Empires II',
  'Warcraft III',
  'Command & Conquer: Red Alert 2',
  'StarCraft: Brood War',
  
  // Sports Multiplayer
  'NBA Street',
  'Pro Evolution Soccer 6',
]

// Known SteamGridDB IDs for some popular games (for faster lookup)
const KNOWN_GAME_IDS: Record<string, number> = {
  'Team Fortress 2': 440,
  'Red Dead Redemption 2': 1174180,
  'Grand Theft Auto IV': 12210,
  'Counter-Strike 1.6': 10,
  'DOOM (1993)': 2280,
  'Quake': 2310,
  'Quake II': 2320,
  'Quake III Arena': 2330,
  'Unreal Tournament (1999)': 13240,
  'Unreal Tournament 2004': 13230,
  'Battlefield 1': 1238840,
  'Battlefield 3': 1238840,
  'Call of Duty 4: Modern Warfare': 7940,
  'Call of Duty: Black Ops': 214870,
  'Age of Empires II': 813780,
  'Warcraft III': 60,
  'StarCraft: Brood War': 50,
  'Diablo II': 40,
  'World of Warcraft': 15,
}

// Preferred username list
const PREFERRED_USERNAMES = [
  'shadowflux',
  'neonblade',
  'frostvector',
  'rogueecho',
  'steelhorizon',
  'crypticnova',
  'valkyrien',
  'orbitstrike',
  'pixelshade',
  'thundercrypt',
  'retroblade',
  'arcaderunner',
  'quantumghost',
  'midnightphase',
  'silvercaster',
  'goldenpilot',
  'emberglitch',
  'onyxstorm',
  'lunarbyte',
  'driftvector',
  'radarflux',
  'astroshift',
  'echoagent',
  'novaspark',
  'roguesignal',
  'shadowcore',
  'lunartrail',
  'emberphase',
  'turboarrow',
  'quantumdrifter',
  'pixelrift',
  'silentpilot',
  'vortexscope',
  'omegaecho',
  'midnightcore',
  'retrotrail',
  'shadowpilot',
  'cobaltwing',
  'ironpulse',
  'neonwarden',
  'ghostpacket',
  'fragline',
  'oldnetgamer',
  'lanwolf',
  'packetloss',
  'respawned',
  'deadserver',
  'lastlobby',
  'nostalgicfps',
  'dialuphero',
]

// Gaming name prefixes and suffixes (for generating similar usernames)
const GAMING_NAME_PARTS = {
  prefixes: [
    'shadow', 'neon', 'frost', 'rogue', 'steel', 'cryptic', 'valkyrie', 'orbit', 'pixel', 'thunder',
    'retro', 'arcade', 'quantum', 'midnight', 'silver', 'golden', 'ember', 'onyx', 'lunar', 'drift',
    'radar', 'astro', 'echo', 'nova', 'shadow', 'lunar', 'ember', 'turbo', 'quantum', 'pixel',
    'silent', 'vortex', 'omega', 'midnight', 'retro', 'shadow', 'cobalt', 'iron', 'neon', 'ghost',
    'frag', 'oldnet', 'lan', 'packet', 'respawn', 'dead', 'last', 'nostalgic', 'dialup',
    'dark', 'light', 'fire', 'ice', 'storm', 'thunder', 'night', 'day', 'blood',
    'steel', 'iron', 'gold', 'silver', 'dragon', 'wolf', 'eagle', 'phoenix', 'tiger', 'lion',
    'cyber', 'digital', 'atomic', 'nano', 'mega', 'ultra', 'super', 'void',
  ],
  suffixes: [
    'flux', 'blade', 'vector', 'echo', 'horizon', 'nova', 'strike', 'shade', 'crypt',
    'runner', 'ghost', 'phase', 'caster', 'pilot', 'glitch', 'storm', 'byte', 'vector',
    'shift', 'agent', 'spark', 'signal', 'core', 'trail', 'phase', 'arrow', 'drifter',
    'rift', 'pilot', 'scope', 'echo', 'core', 'trail', 'pilot', 'wing', 'pulse', 'warden',
    'packet', 'line', 'gamer', 'wolf', 'loss', 'ed', 'server', 'lobby', 'fps', 'hero',
    'killer', 'slayer', 'hunter', 'warrior', 'master', 'lord', 'king', 'queen',
    'sword', 'arrow', 'bow', 'shield', 'axe', 'hammer', 'spear', 'dagger',
    'x', 'z', '99', '2024', 'pro', 'elite', 'legend', 'champion',
  ],
  numbers: ['99', '2024', '2023', '1337', '420', '69', '88', '77', '66', '55'],
}

// Random gaming bios
const GAMING_BIOS = [
  'Competitive player looking for skilled teammates',
  'Casual gamer who loves exploring new worlds',
  'Speedrunner and achievement hunter',
  'Team player focused on strategy and communication',
  'Solo player who enjoys challenging content',
  'PVP enthusiast always up for a match',
  'PVE player who loves story-driven games',
  'Collector trying to complete every game',
  'Streamer building a gaming community',
  'Tournament player competing at the highest level',
  'Night owl gamer, always online after midnight',
  'Weekend warrior grinding on Saturdays',
  'Early bird who games before work',
  'Multiplayer specialist, love co-op games',
  'Single-player story enthusiast',
  'RPG fanatic, hundreds of hours in character building',
  'FPS pro with lightning-fast reflexes',
  'Strategy mastermind planning every move',
  'Racing game speed demon',
  'Fighting game combo master',
  'Survival game expert, always prepared',
  'Horror game enthusiast, fear is my friend',
  'Puzzle solver who loves brain teasers',
  'Open world explorer, completionist at heart',
  'Indie game supporter, always discovering gems',
]

function generateSimilarUsername(): string {
  // Generate a username similar to the preferred style
  const usePrefix = Math.random() > 0.2
  const useSuffix = Math.random() > 0.2
  const useNumber = Math.random() > 0.3

  let name = ''

  if (usePrefix) {
    name += GAMING_NAME_PARTS.prefixes[Math.floor(Math.random() * GAMING_NAME_PARTS.prefixes.length)]
  }

  // Add a middle part sometimes (compound names)
  if (Math.random() > 0.6 && usePrefix) {
    name += GAMING_NAME_PARTS.prefixes[Math.floor(Math.random() * GAMING_NAME_PARTS.prefixes.length)]
  }

  if (useSuffix) {
    name += GAMING_NAME_PARTS.suffixes[Math.floor(Math.random() * GAMING_NAME_PARTS.suffixes.length)]
  }

  if (useNumber) {
    name += GAMING_NAME_PARTS.numbers[Math.floor(Math.random() * GAMING_NAME_PARTS.numbers.length)]
  }

  // Fallback if name is empty
  if (!name) {
    name = GAMING_NAME_PARTS.prefixes[Math.floor(Math.random() * GAMING_NAME_PARTS.prefixes.length)] +
           GAMING_NAME_PARTS.suffixes[Math.floor(Math.random() * GAMING_NAME_PARTS.suffixes.length)]
  }

  // Add random number to ensure uniqueness (smaller range for similar style)
  name += Math.floor(Math.random() * 1000)

  return name.toLowerCase()
}

async function generateRandomGamingName(supabase: any): Promise<string> {
  // Check which preferred usernames are already taken
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('username')
    .in('username', PREFERRED_USERNAMES)

  const takenUsernames = new Set(
    (existingProfiles || []).map((p: { username: string }) => p.username.toLowerCase())
  )

  // Get available preferred usernames
  const availablePreferred = PREFERRED_USERNAMES.filter(
    u => !takenUsernames.has(u.toLowerCase())
  )
  
  if (availablePreferred.length > 0) {
    // Return a random available preferred username
    return availablePreferred[Math.floor(Math.random() * availablePreferred.length)]
  }

  // If all preferred usernames are used, generate similar ones
  return generateSimilarUsername()
}

function generateRandomBio(): string {
  return GAMING_BIOS[Math.floor(Math.random() * GAMING_BIOS.length)]
}

function generateCleanDisplayName(username: string): string {
  // Sometimes add spaces, sometimes keep it as is (70% chance of adding spaces)
  const shouldAddSpaces = Math.random() > 0.3
  
  if (!shouldAddSpaces) {
    // Keep original username but capitalize first letter
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()
  }
  
  // Remove trailing numbers and format nicely
  // Example: "ShadowKiller99" -> "Shadow Killer"
  // Example: "CyberNinja2024" -> "Cyber Ninja"
  // Example: "shadowflux" -> "Shadow Flux"
  
  // Remove trailing numbers
  let clean = username.replace(/\d+$/, '')
  
  // Add spaces before capital letters (camelCase to Title Case)
  clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2')
  
  // If no capitals found, try to split compound words
  // Look for common patterns like "shadowflux" -> "shadow flux"
  if (clean === username.replace(/\d+$/, '')) {
    // Try to find word boundaries in lowercase compound words
    // Common patterns: shadow+flux, neon+blade, etc.
    const commonWords = [
      'shadow', 'neon', 'frost', 'rogue', 'steel', 'cryptic', 'valkyrie', 'orbit', 'pixel', 'thunder',
      'retro', 'arcade', 'quantum', 'midnight', 'silver', 'golden', 'ember', 'onyx', 'lunar', 'drift',
      'radar', 'astro', 'echo', 'nova', 'lunar', 'turbo', 'silent', 'vortex', 'omega', 'cobalt',
      'iron', 'ghost', 'frag', 'packet', 'respawn', 'dead', 'last', 'nostalgic', 'dialup',
      'flux', 'blade', 'vector', 'echo', 'horizon', 'strike', 'shade', 'crypt', 'runner', 'ghost',
      'phase', 'caster', 'pilot', 'glitch', 'storm', 'byte', 'shift', 'agent', 'spark', 'signal',
      'core', 'trail', 'arrow', 'drifter', 'rift', 'scope', 'wing', 'pulse', 'warden', 'line',
      'gamer', 'wolf', 'loss', 'server', 'lobby', 'fps', 'hero'
    ]
    
    // Try to find word boundaries
    for (const word of commonWords) {
      if (clean.toLowerCase().startsWith(word) && clean.length > word.length) {
        const remaining = clean.slice(word.length)
        if (remaining.length > 2) {
          clean = word.charAt(0).toUpperCase() + word.slice(1) + ' ' + 
                  remaining.charAt(0).toUpperCase() + remaining.slice(1)
          break
        }
      }
      if (clean.toLowerCase().endsWith(word) && clean.length > word.length) {
        const remaining = clean.slice(0, -word.length)
        if (remaining.length > 2) {
          clean = remaining.charAt(0).toUpperCase() + remaining.slice(1) + ' ' + 
                  word.charAt(0).toUpperCase() + word.slice(1)
          break
        }
      }
    }
  }
  
  // Capitalize first letter of each word
  clean = clean.split(' ').map(word => {
    if (word.length === 0) return word
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
  
  // If result is empty or too short, use a fallback
  if (clean.length < 3) {
    clean = username.replace(/\d+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
    clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
  }
  
  return clean || username
}

async function findGameByName(gameName: string): Promise<{ id: number; name: string } | null> {
  // First, try known ID if available
  const knownId = KNOWN_GAME_IDS[gameName]
  if (knownId) {
    try {
      const gameDetails = await getGameById(knownId)
      if (gameDetails && gameDetails.coverUrl) {
        return { id: knownId, name: gameDetails.name }
      }
    } catch (error) {
      // Continue to search if ID lookup fails
    }
  }

  // Search for the game by name
  try {
    const searchResults = await searchGames(gameName)
    if (searchResults && searchResults.length > 0) {
      // Try to find exact or close match
      const normalizedSearch = gameName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      for (const game of searchResults) {
        const normalizedName = game.name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
        // Check if it's a close match (contains key words)
        const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 2)
        const nameWords = normalizedName.split(/\s+/)
        const matchCount = searchWords.filter(word => nameWords.some(nw => nw.includes(word) || word.includes(nw))).length
        
        if (matchCount >= Math.min(2, searchWords.length)) {
          // Verify the game has a cover image
          try {
            const gameDetails = await getGameById(game.id)
            if (gameDetails && gameDetails.coverUrl) {
              return { id: game.id, name: game.name }
            }
          } catch (error) {
            continue
          }
        }
      }
      
      // If no close match, try first result if it has a cover
      const firstGame = searchResults[0]
      try {
        const gameDetails = await getGameById(firstGame.id)
        if (gameDetails && gameDetails.coverUrl) {
          return { id: firstGame.id, name: firstGame.name }
        }
      } catch (error) {
        // Skip if no cover
      }
    }
  } catch (error) {
    // Search failed, return null
  }

  return null
}

async function getRandomGames(count: number = 5): Promise<Array<{ id: number; name: string }>> {
  const games: Array<{ id: number; name: string }> = []
  const usedIds = new Set<number>()
  const usedNames = new Set<string>()

  // Shuffle the classic games list
  const shuffledGames = [...CLASSIC_GAMES].sort(() => Math.random() - 0.5)
  
  // Try to find games from the classic list
  for (const gameName of shuffledGames) {
    if (games.length >= count) break
    if (usedNames.has(gameName.toLowerCase())) continue

    try {
      const game = await findGameByName(gameName)
      if (game && !usedIds.has(game.id)) {
        games.push(game)
        usedIds.add(game.id)
        usedNames.add(gameName.toLowerCase())
      }
    } catch (error) {
      // Skip if game not found
      continue
    }
  }

  // If we still need more games, try searching with generic terms from the classic games
  if (games.length < count) {
    const fallbackTerms = ['quake', 'doom', 'unreal', 'battlefield', 'call of duty', 'counter-strike']
    for (const term of fallbackTerms) {
      if (games.length >= count) break
      
      try {
        const searchResults = await searchGames(term)
        for (const game of searchResults) {
          if (games.length >= count) break
          if (usedIds.has(game.id)) continue
          
          // Verify the game has a cover image before adding
          try {
            const gameDetails = await getGameById(game.id)
            if (gameDetails && gameDetails.coverUrl) {
              games.push({ id: game.id, name: game.name })
              usedIds.add(game.id)
            }
          } catch (error) {
            // Skip games without covers
            continue
          }
        }
      } catch (error) {
        continue
      }
    }
  }

  return games.slice(0, count)
}

/**
 * Crop and zoom a hero image to square avatar, avoiding text areas (typically bottom/center)
 * Heroes are typically wide/landscape, so we crop a square from them
 * Returns the cropped image as a buffer
 */
async function cropAvatarWithRandomZoom(
  imageUrl: string,
  targetSize: number = 512
): Promise<Buffer | null> {
  try {
    // Dynamically import sharp to avoid bundling issues
    const sharp = (await import('sharp')).default

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return null
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 1920
    const height = metadata.height || 620

    // Heroes are typically wide/landscape (width > height)
    // We'll crop a square from the hero image
    // Random zoom between 1.5x and 3x (more zoomed in)
    const zoom = 1.5 + Math.random() * 1.5 // 1.5 to 3.0

    // Calculate square crop size (use the smaller dimension as base)
    const baseSize = Math.min(width, height)
    const cropSize = baseSize / zoom

    // Avoid text areas: typically in bottom 30% and center-bottom
    // Prefer top-left, top-right, top-center, or upper-middle areas
    const avoidBottomPercent = 0.3 // Avoid bottom 30%
    const maxY = height - (height * avoidBottomPercent) - cropSize

    // Random position, but avoid bottom area
    // Prefer top areas (0 to maxY)
    const positionY = Math.random() * Math.max(0, maxY)
    
    // For X, center it with some randomness (heroes are wide, so we can pick from center area)
    const centerX = (width - cropSize) / 2
    const randomOffsetX = (Math.random() - 0.5) * (width - cropSize) * 0.4 // ±20% from center
    const positionX = Math.max(0, Math.min(width - cropSize, centerX + randomOffsetX))

    // Ensure we don't go out of bounds
    const finalX = Math.max(0, Math.min(positionX, width - cropSize))
    const finalY = Math.max(0, Math.min(positionY, height - cropSize))

    // Crop square from hero and resize to target size
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(finalX),
        top: Math.round(finalY),
        width: Math.round(cropSize),
        height: Math.round(cropSize),
      })
      .resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    return croppedBuffer
  } catch (error) {
    console.error('Error cropping avatar:', error)
    return null
  }
}

/**
 * Crop and zoom a banner/cover image, avoiding text areas (typically bottom/center)
 * Returns the cropped image as a buffer
 */
async function cropBannerAvoidingText(
  imageUrl: string,
  targetWidth: number = 1920,
  targetHeight: number = 620
): Promise<Buffer | null> {
  try {
    // Dynamically import sharp to avoid bundling issues
    const sharp = (await import('sharp')).default

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return null
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 1920
    const height = metadata.height || 620

    // Calculate aspect ratio for banner (typically 3:1 or wider)
    const bannerAspect = targetWidth / targetHeight

    // Random zoom between 1.2x and 2x for banners
    const zoom = 1.2 + Math.random() * 0.8 // 1.2 to 2.0

    // Calculate crop dimensions maintaining banner aspect ratio
    let cropWidth = width / zoom
    let cropHeight = cropWidth / bannerAspect

    // If height is too large, adjust based on height instead
    if (cropHeight > height) {
      cropHeight = height / zoom
      cropWidth = cropHeight * bannerAspect
    }

    // Avoid text areas: typically in bottom 40% and center-bottom
    // Prefer top areas for banners
    const avoidBottomPercent = 0.4 // Avoid bottom 40%
    const maxY = height - (height * avoidBottomPercent) - cropHeight

    // Random position, but prefer top areas
    const positionY = Math.random() * Math.max(0, maxY)
    
    // For X, center it with some randomness
    const centerX = (width - cropWidth) / 2
    const randomOffsetX = (Math.random() - 0.5) * (width - cropWidth) * 0.4 // ±20% from center
    const positionX = Math.max(0, Math.min(width - cropWidth, centerX + randomOffsetX))

    // Ensure we don't go out of bounds
    const finalX = Math.max(0, Math.min(positionX, width - cropWidth))
    const finalY = Math.max(0, Math.min(positionY, height - cropHeight))

    // Crop and resize to target size
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(finalX),
        top: Math.round(finalY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      })
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    return croppedBuffer
  } catch (error) {
    console.error('Error cropping banner:', error)
    return null
  }
}

/**
 * Upload cropped avatar to Supabase storage
 */
async function uploadAvatarToStorage(
  userId: string,
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient()
    const fileName = `avatar-${Date.now()}.jpg`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Error uploading avatar:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadAvatarToStorage:', error)
    return null
  }
}

/**
 * Upload cropped banner to Supabase storage
 */
async function uploadBannerToStorage(
  userId: string,
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient()
    const fileName = `banner-${Date.now()}.jpg`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Error uploading banner:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadBannerToStorage:', error)
    return null
  }
}

export async function POST() {
  try {
    // Check authentication and founder status
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const serverSupabase = await createServerSupabaseClient()
    
    const { data: { user } } = await serverSupabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is founder
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan_tier !== 'founder') {
      return NextResponse.json(
        { error: 'Forbidden: Founder access required' },
        { status: 403 }
      )
    }

    const supabase = await getSupabaseClient()

    // Generate random gaming name (prefers list, then generates similar)
    let username = await generateRandomGamingName(supabase)
    let attempts = 0
    const maxAttempts = 20 // Increased attempts for better chance

    // Ensure username is unique (double-check)
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()

      if (!existing) {
        break
      }

      // Generate a new username (will check preferred list again)
      username = await generateRandomGamingName(supabase)
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique username after multiple attempts' },
        { status: 500 }
      )
    }

    // Generate bio
    const bio = generateRandomBio()

    // Generate clean display name
    const displayName = generateCleanDisplayName(username)

    // Get random games (3-8 games per user)
    const numGames = Math.floor(Math.random() * 6) + 3
    const games = await getRandomGames(numGames)

    if (games.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch games for seeding' },
        { status: 500 }
      )
    }

    // Pick a random game for avatar and cover
    const avatarGame = games[Math.floor(Math.random() * games.length)]
    const coverGame = games[Math.floor(Math.random() * games.length)]

    // Fetch avatar (hero image) and cover (hero image)
    const [avatarCover, coverImage] = await Promise.all([
      getGameHero(avatarGame.id),
      getGameHero(coverGame.id),
    ])

    // Create auth user
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@seed.example.com`
    const password = `Seed${Math.random().toString(36).slice(2, 15)}!`

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name: displayName,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError?.message },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Crop and upload avatar with random zoom (avoiding text areas)
    let avatarUrl: string | null = null
    if (avatarCover?.url) {
      const croppedBuffer = await cropAvatarWithRandomZoom(avatarCover.url)
      if (croppedBuffer) {
        const uploadedUrl = await uploadAvatarToStorage(userId, croppedBuffer)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }
      
      // Fallback to original if crop/upload failed
      if (!avatarUrl) {
        avatarUrl = avatarCover.url
      }
    }

    // Update profile with custom fields
    const profileUpdate: any = {
      username,
      display_name: displayName,
      bio,
    }

    if (avatarUrl) {
      profileUpdate.avatar_url = avatarUrl
    }

    // Crop and upload banner with zoom (avoiding text areas)
    let bannerUrl: string | null = null
    if (coverImage?.url) {
      const croppedBannerBuffer = await cropBannerAvoidingText(coverImage.url)
      if (croppedBannerBuffer) {
        const uploadedBannerUrl = await uploadBannerToStorage(userId, croppedBannerBuffer)
        if (uploadedBannerUrl) {
          bannerUrl = uploadedBannerUrl
        }
      }
      
      // Fallback to original if crop/upload failed
      if (!bannerUrl) {
        bannerUrl = coverImage.url
      }
      
      profileUpdate.banner_url = bannerUrl
      // Also set cover_image_url for backward compatibility
      profileUpdate.cover_image_url = bannerUrl
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      )
    }

    // Add games to user library
    const userGames = games.map((game) => ({
      user_id: userId,
      game_id: game.id.toString(),
      game_name: game.name,
    }))

    const { error: gamesError } = await supabase
      .from('user_games')
      .insert(userGames)

    if (gamesError) {
      console.error('Error adding games:', gamesError)
      // Don't fail the whole request if games fail
    }

    return NextResponse.json({
      message: 'User generated successfully',
      user: {
        id: userId,
        username,
        email,
        password,
        gamesCount: games.length,
      },
    })
  } catch (error: any) {
    console.error('Error seeding user:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

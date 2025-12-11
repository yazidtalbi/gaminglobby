/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Extract game name from slug (reverse operation)
 * Note: This is approximate since slugs lose some information
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if a slug matches a game name
 */
export function slugMatchesGameName(slug: string, gameName: string): boolean {
  const gameSlug = generateSlug(gameName)
  return gameSlug === slug.toLowerCase()
}


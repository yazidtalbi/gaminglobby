/**
 * Sanitize text for use in meta tags
 */

const MAX_TITLE_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 160

/**
 * Strip HTML tags and dangerous characters
 */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities (basic)
    .replace(/[<>]/g, '') // Remove remaining angle brackets
    .trim()
}

/**
 * Normalize whitespace
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Sanitize text for meta tags (title, description, etc.)
 */
export function sanitizeForMeta(text: string, maxLength?: number): string {
  if (!text) return ''
  
  let sanitized = stripHtml(text)
  sanitized = normalizeWhitespace(sanitized)
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...'
  }
  
  return sanitized
}

/**
 * Sanitize for title (60 chars)
 */
export function sanitizeTitle(text: string): string {
  return sanitizeForMeta(text, MAX_TITLE_LENGTH)
}

/**
 * Sanitize for description (160 chars)
 */
export function sanitizeDescription(text: string): string {
  return sanitizeForMeta(text, MAX_DESCRIPTION_LENGTH)
}

/**
 * Sanitize URL path segment
 */
export function sanitizeUrlSegment(segment: string): string {
  return segment
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

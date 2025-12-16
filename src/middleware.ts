import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip if already on /is/ path (internal routing)
  if (pathname.startsWith('/is/')) {
    return NextResponse.next()
  }
  
  // Rewrite /is-{slug}-still-active to /is/{slug}-still-active (internal rewrite, URL stays the same)
  // This allows SEO-friendly URLs like /is-counter-strike-2-still-active
  const isGameAliveMatch = pathname.match(/^\/is-([^-]+(?:-[^-]+)*)(-still-active|-dead)?$/)
  
  if (isGameAliveMatch) {
    const slug = isGameAliveMatch[1]
    const existingSuffix = isGameAliveMatch[2]
    
    // Remove duplicate -still-active or -dead suffixes
    let cleanSlug = slug
    while (cleanSlug.endsWith('-still-active') || cleanSlug.endsWith('-dead')) {
      cleanSlug = cleanSlug.replace(/-still-active$/, '').replace(/-dead$/, '')
    }
    
    // If suffix already exists, use it; otherwise add -still-active
    const finalSlug = existingSuffix ? `${cleanSlug}${existingSuffix}` : `${cleanSlug}-still-active`
    const newPath = `/is/${finalSlug}`
    
    // Rewrite internally (URL stays as /is-{slug}, but serves from /is/{slug})
    return NextResponse.rewrite(new URL(newPath, request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/is-:path*',
  ],
}

// /src/lib/landing-images.ts
// Landing page image map and helper function

export type LandingImageKey =
  | 'hero'
  | 'teammates'
  | 'step-create-lobby'
  | 'step-match'
  | 'step-chat'
  | 'feature-chat'
  | 'feature-matchmaking'
  | 'feature-filters'
  | 'feature-games'
  | 'stats-bg'
  | 'pricing-free'
  | 'pricing-pro'
  | 'blog-1'
  | 'blog-2'
  | 'blog-3'
  | 'blog-4'
  | 'final-cta'

interface LandingImage {
  src: string
  alt: string
  badge?: string
}

export const LANDING_IMAGES: Record<LandingImageKey, LandingImage> = {
  hero: {
    src: '/landing/hero.png',
    alt: 'Apoxer platform showing active gaming lobbies and matchmaking interface',
  },
  teammates: {
    src: '/landing/teammates.jpg',
    alt: 'Gamers finding and connecting with teammates through Apoxer',
  },
  'step-create-lobby': {
    src: '/landing/step-create-lobby.png',
    alt: 'Creating a new gaming lobby with custom settings',
    badge: 'Step 1',
  },
  'step-match': {
    src: '/landing/step-match.png',
    alt: 'Matching with compatible players based on preferences',
    badge: 'Step 2',
  },
  'step-chat': {
    src: '/landing/step-chat.png',
    alt: 'Real-time chat with matched teammates',
    badge: 'Step 3',
  },
  'feature-chat': {
    src: '/landing/feature-chat.png',
    alt: 'Real-time chat feature interface',
  },
  'feature-matchmaking': {
    src: '/landing/feature-matchmaking.png',
    alt: 'Smart matchmaking algorithm visualization',
  },
  'feature-filters': {
    src: '/landing/feature-filters.png',
    alt: 'Advanced filtering options for finding players',
  },
  'feature-games': {
    src: '/landing/feature-games.png',
    alt: 'Browse over 50,000 supported games',
  },
  'stats-bg': {
    src: '/landing/stats-bg.png',
    alt: '', // Decorative background
  },
  'pricing-free': {
    src: '/landing/pricing-free.png',
    alt: 'Free tier features preview',
  },
  'pricing-pro': {
    src: '/landing/pricing-pro.png',
    alt: 'Pro tier premium features preview',
    badge: 'Pro',
  },
  'blog-1': {
    src: '/landing/blog-1.jpg',
    alt: 'Finding teammates for competitive gaming',
  },
  'blog-2': {
    src: '/landing/blog-2.jpg',
    alt: 'Top multiplayer games to play with friends',
  },
  'blog-3': {
    src: '/landing/blog-3.jpg',
    alt: 'Matchmaking tips and strategies',
  },
  'blog-4': {
    src: '/landing/blog-4.jpg',
    alt: 'Community success stories',
  },
  'final-cta': {
    src: '/landing/final-cta.png',
    alt: '', // Decorative background
  },
}

export function getLandingImage(key: LandingImageKey): LandingImage {
  return LANDING_IMAGES[key]
}

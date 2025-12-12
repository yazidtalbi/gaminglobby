'use client'

import { GameLogoCard } from './GameLogoCard'

interface MostSearchedGameCardWrapperProps {
  gameId: string
  name: string
  logoUrl: string | null
}

export function MostSearchedGameCardWrapper({ gameId, name, logoUrl }: MostSearchedGameCardWrapperProps) {
  return <GameLogoCard id={gameId} name={name} logoUrl={logoUrl} />
}


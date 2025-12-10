export type AwardType = 'good_teammate' | 'strategic' | 'friendly' | 'chill'

export interface AwardConfig {
  type: AwardType
  label: string
  shortLabel: string
  emoji: string
  description: string
}

export const AWARD_CONFIGS: Record<AwardType, AwardConfig> = {
  good_teammate: {
    type: 'good_teammate',
    label: 'Good Teammate',
    shortLabel: 'GT',
    emoji: '🤝',
    description: 'Reliable and cooperative player',
  },
  strategic: {
    type: 'strategic',
    label: 'Strategic',
    shortLabel: 'ST',
    emoji: '🧠',
    description: 'Great game sense and tactics',
  },
  friendly: {
    type: 'friendly',
    label: 'Friendly',
    shortLabel: 'FR',
    emoji: '😊',
    description: 'Positive and welcoming',
  },
  chill: {
    type: 'chill',
    label: 'Chill',
    shortLabel: 'CH',
    emoji: '😎',
    description: 'Relaxed and easy-going',
  },
}

export function getAwardConfig(type: AwardType): AwardConfig {
  return AWARD_CONFIGS[type]
}

export function getAllAwardTypes(): AwardType[] {
  return Object.keys(AWARD_CONFIGS) as AwardType[]
}


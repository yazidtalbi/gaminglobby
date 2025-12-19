'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DemoBadgeProps {
  mode: 'live' | 'demo'
}

export function DemoBadge({ mode }: DemoBadgeProps) {
  if (mode === 'live') {
    return (
      <Badge variant="success" className="text-xs">
        Live activity
      </Badge>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 cursor-help">
            Sample activity
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            These are example lobbies to preview the experience. Join to create real activity.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

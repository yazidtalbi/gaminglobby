'use client'

import { TournamentWithHost } from '@/types/tournaments'
import { TournamentState } from '@/lib/tournaments/state'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

interface AboutAndRulesAccordionsProps {
  tournament: TournamentWithHost
  tournamentState: TournamentState
}

export function AboutAndRulesAccordions({
  tournament,
  tournamentState,
}: AboutAndRulesAccordionsProps) {
  // Auto-expand rules for upcoming tournaments
  const defaultOpen = tournamentState === 'upcoming' && tournament.rules ? ['rules'] : []

  return (
    <div className="mb-8">
      <Accordion type="multiple" defaultValue={defaultOpen}>
        {/* About Section */}
        {tournament.description && (
          <AccordionItem value="about">
            <AccordionTrigger>
              About this tournament
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                {tournament.description}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Rules Section */}
        {tournament.rules && (
          <AccordionItem value="rules">
            <AccordionTrigger>
              Rules
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                {tournament.rules}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

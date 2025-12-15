'use client'

import { TournamentMatch, TournamentWithHost } from '@/types/tournaments'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { TournamentMatchCard } from './TournamentMatchCard'
import { Trophy } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface TournamentBracketAccordionProps {
  matches: TournamentMatch[]
  tournament: TournamentWithHost
  tournamentId: string
  onUpdate: () => void
}

export function TournamentBracketAccordion({
  matches,
  tournament,
  tournamentId,
  onUpdate,
}: TournamentBracketAccordionProps) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_number]) {
      acc[match.round_number] = []
    }
    acc[match.round_number].push(match)
    return acc
  }, {} as Record<number, TournamentMatch[]>)

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => b - a) // Sort descending (finals first)

  if (rounds.length === 0) {
    return (
      <div className="mb-8 border border-slate-700/50 bg-slate-800/30 p-8 text-center rounded-lg">
        <p className="text-slate-400">No matches found. The bracket may not have been generated yet.</p>
      </div>
    )
  }

  const finalRound = rounds[0] // Highest round number (finals)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-title text-white">Bracket</h2>
        <Link
          href={`/tournaments/${tournamentId}/matches`}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-title uppercase"
        >
          View All Matches →
        </Link>
      </div>

      <Accordion type="multiple" defaultValue={[finalRound.toString()]}>
        {rounds.map((roundNumber) => {
          const roundMatches = matchesByRound[roundNumber]
          const completedMatches = roundMatches.filter(m => m.status === 'completed').length
          const isFinalRound = roundNumber === finalRound

          return (
            <AccordionItem key={roundNumber} value={roundNumber.toString()}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <span className="font-title uppercase">
                    {isFinalRound ? 'Finals' : `Round ${roundNumber}`}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {completedMatches}/{roundMatches.length} completed
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {roundMatches.map((match) => {
                    const isWinner = match.winner_id && match.status === 'completed'

                    return (
                      <div
                        key={match.id}
                        className={`relative rounded-lg overflow-hidden ${
                          isWinner
                            ? 'ring-2 ring-yellow-400/30 bg-yellow-400/5'
                            : ''
                        }`}
                      >
                        {isWinner && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                          </div>
                        )}
                        <TournamentMatchCard
                          match={match}
                          tournament={tournament}
                          onUpdate={onUpdate}
                        />
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

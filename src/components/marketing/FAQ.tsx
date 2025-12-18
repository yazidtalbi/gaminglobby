'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const faqs = [
  {
    question: 'Is it a Discord replacement?',
    answer: 'Not exactly. Apoxer complements Discord by making it easier to find players and communities. Many communities link their Discord servers here. Think of it as a discovery layer that connects you to existing communities.',
  },
  {
    question: 'How do lobbies work?',
    answer: 'Lobbies are short-lived matchmaking sessions. They expire after 1 hour of host inactivity, so you only see players who are actively ready to play. Join an existing lobby or create one with your preferences (platform, region, play style).',
  },
  {
    question: 'What about older games?',
    answer: 'That&apos;s where Apoxer shines. We make fragmented and older multiplayer games visible again. See who&apos;s still playing, join their lobbies, and discover community links—all organized per game.',
  },
  {
    question: 'Is it free?',
    answer: 'Yes, it&apos;s free during Early Access. Sign up and get access to all features, plus an exclusive Early Supporter badge. A Pro tier is coming later with optional premium features.',
  },
  {
    question: 'How do you prevent spam?',
    answer: 'Lobbies expire quickly (1 hour of inactivity), which naturally filters out dead listings. We also have community moderation tools, user reporting, and rate limiting on lobby creation.',
  },
  {
    question: 'Can I link my community?',
    answer: 'Yes! You can add community links (Discord, Mumble, etc.) to any game page. This helps players discover your community when they&apos;re looking for that specific game.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative z-10 py-20 lg:py-32 bg-slate-900/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="border-slate-800 bg-slate-900/50 cursor-pointer hover:border-cyan-500/30 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                    {openIndex === index && (
                      <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

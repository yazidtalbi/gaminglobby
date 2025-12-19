'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Minus, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    question: 'What is Apoxer?',
    answer: 'Apoxer is a gaming matchmaking platform that helps players find teammates, join lobbies, and discover game communities. We make fragmented multiplayer games visible again.',
  },
  {
    question: 'How to find people to play games with?',
    answer: 'Browse active lobbies by game, filter by platform and region, or create your own lobby. You can also explore player profiles and join communities linked to your favorite games.',
  },
  {
    question: 'Does Apoxer offer voice chat for gaming?',
    answer: 'Apoxer helps you find players and join lobbies. Voice chat is typically handled through Discord servers or other platforms that communities link in their game directories.',
  },
  {
    question: 'How do lobbies work?',
    answer: 'Lobbies are short-lived matchmaking sessions. They expire after 1 hour of host inactivity, so you only see players who are actively ready to play. Join an existing lobby or create one with your preferences.',
  },
  {
    question: 'Is it free?',
    answer: 'Yes, Apoxer is free during Early Access. Sign up and get access to all features, including unlimited lobby creation, access to all games, and community directories.',
  },
  {
    question: 'What about older games?',
    answer: 'That\'s where Apoxer shines. We make fragmented and older multiplayer games visible again. See who\'s still playing, join their lobbies, and discover community links—all organized per game.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative z-10 py-12 lg:py-16 bg-slate-900/30">
      <div className="mx-auto max-w-[1600px] px-8 sm:px-12 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: CTA */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-title font-bold text-white mb-4 lg:mb-6">
              ANY QUESTIONS?
            </h2>
            <p className="text-base lg:text-lg text-slate-300 mb-6 lg:mb-8">
              Have more questions? Write to us
            </p>
            <Button
              asChild
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              <Link href="/contact">
                <MessageCircle className="mr-2 w-5 h-5" />
                Contact us
              </Link>
            </Button>
          </div>

          {/* Right: FAQ Accordion */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="border-slate-800 bg-slate-900/50"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 lg:p-8 text-left"
                  >
                    <span className="text-sm lg:text-base font-semibold text-white pr-4">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <Minus className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-6 lg:px-8 lg:pb-8 text-xs lg:text-sm text-slate-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

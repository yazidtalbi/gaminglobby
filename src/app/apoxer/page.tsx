import { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { Hero } from '@/components/marketing/Hero'
import { ProblemSolution } from '@/components/marketing/ProblemSolution'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { FeatureBenefits } from '@/components/marketing/FeatureBenefits'
import { TrustTiles } from '@/components/marketing/TrustTiles'
import { Pricing } from '@/components/marketing/Pricing'
import { FAQ } from '@/components/marketing/FAQ'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { ResourcesPreview } from '@/components/marketing/ResourcesPreview'
import { SiteFooter } from '@/components/marketing/SiteFooter'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Apoxer | Find Teammates Fast. Matchmaking for 50,000+ Games',
  description: 'Find teammates fast across 50,000+ games. Create or join active lobbies instantly, chat in real time, and play with players who fit your style. Free to start.',
  alternates: {
    canonical: 'https://apoxer.com/apoxer',
  },
  openGraph: {
    title: 'Apoxer | Find Teammates Fast. Matchmaking for 50,000+ Games',
    description: 'Find teammates fast across 50,000+ games. Create or join active lobbies instantly, chat in real time, and play with players who fit your style. Free to start.',
    type: 'website',
    url: 'https://apoxer.com/apoxer',
    siteName: 'Apoxer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apoxer | Find Teammates Fast. Matchmaking for 50,000+ Games',
    description: 'Find teammates fast across 50,000+ games. Create or join active lobbies instantly, chat in real time, and play with players who fit your style. Free to start.',
  },
}

const faqItems = [
  {
    question: 'Is Apoxer free?',
    answer: 'Yes, Apoxer is free to start. You can create lobbies, join games, and find teammates at no cost. We offer a Pro plan with additional features for power users, but the core matchmaking experience is completely free.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'Apoxer works on all major gaming platforms including PC (Steam, Epic Games, Battle.net), PlayStation, Xbox, Nintendo Switch, and mobile. Our platform-agnostic approach means you can find teammates regardless of where you play.',
  },
  {
    question: 'How long does sign up take?',
    answer: 'Signing up takes less than 1 minute. Simply provide your email or connect with a social account, choose a username, and you\'re ready to start finding teammates. No credit card required.',
  },
  {
    question: 'How do lobbies work?',
    answer: 'Lobbies are short-lived matchmaking sessions that help you find players ready to play right now. Create a lobby with your game, platform, and preferences, or browse active lobbies to join. Once you find a match, start playing together. Lobbies automatically close after a period of inactivity to keep the experience fresh.',
  },
  {
    question: 'What do I get with Pro?',
    answer: 'Pro members ($4.99/month) get auto-invite to fill lobbies instantly, event creation and management, custom profile banners, a Pro badge, and early access to new features like collections. Pro is optional and designed for serious players who want the best matchmaking experience.',
  },
]

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Apoxer',
    url: 'https://apoxer.com',
    logo: 'https://apoxer.com/logo.png',
    description: 'Modern LFG and gaming matchmaking platform for 50,000+ games',
    sameAs: [
      'https://twitter.com/apoxer',
      'https://discord.gg/apoxer',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Apoxer',
    url: 'https://apoxer.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://apoxer.com/games?query={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  },
]

export default function ApoxerLandingPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <SiteHeader />
        <main>
          <Hero />
          <ProblemSolution />
          <HowItWorks />
          <FeatureBenefits />
          <TrustTiles />
          <Pricing />
          <FAQ items={faqItems} />
          <FinalCTA />
          <ResourcesPreview />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}

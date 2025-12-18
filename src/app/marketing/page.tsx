import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  generateMarketingMetadata,
  generateMarketingJsonLd,
  generateWebSiteJsonLd,
  generateSoftwareApplicationJsonLd,
} from '@/lib/seo/marketing'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { Hero } from '@/components/marketing/Hero'
import { SocialProof } from '@/components/marketing/SocialProof'
import { Features } from '@/components/marketing/Features'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { GameDiscoveryPreview } from '@/components/marketing/GameDiscoveryPreview'
import { Testimonials } from '@/components/marketing/Testimonials'
import { EarlyAccess } from '@/components/marketing/EarlyAccess'
import { FAQ } from '@/components/marketing/FAQ'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { MobileStickyCTA } from '@/components/marketing/MobileStickyCTA'

export const metadata: Metadata = generateMarketingMetadata({
  title: 'Apoxer - Find Players, Join Lobbies, Discover Communities',
  description: 'Find players for any game—fast. Join short-lived lobbies, discover game communities, and make fragmented multiplayer games visible again. No Discord hunting required.',
  path: '/marketing',
})

export default function MarketingPage() {
  const jsonLd = [
    generateMarketingJsonLd(),
    generateWebSiteJsonLd(),
    generateSoftwareApplicationJsonLd(),
  ]

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="relative z-10 min-h-screen">
        <MarketingNav />
        <main>
          <Hero />
          <SocialProof />
          <Features />
          <HowItWorks />
          <GameDiscoveryPreview />
          <Testimonials />
          <EarlyAccess />
          <FAQ />
          <FinalCTA />
        </main>
        <MarketingFooter />
        <MobileStickyCTA />
      </div>
    </>
  )
}

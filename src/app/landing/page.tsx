import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  generateMarketingMetadata,
  generateMarketingJsonLd,
  generateWebSiteJsonLd,
  generateSoftwareApplicationJsonLd,
} from '@/lib/seo/marketing'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { HeroCarouselSection } from '@/components/landing-page/HeroCarouselSection'
import { TrustBanner } from '@/components/landing-page/TrustBanner'
import { AccessGamesSection } from '@/components/landing-page/AccessGamesSection'
import { TrendingGames } from '@/components/landing-page/TrendingGames'
import { UpcomingEvents } from '@/components/landing-page/UpcomingEvents'
import { TournamentsSection } from '@/components/landing-page/TournamentsSection'
import { FAQSection } from '@/components/landing-page/FAQSection'
import { CommunityCTA } from '@/components/landing-page/CommunityCTA'
import { LatestNews } from '@/components/marketing-v2/LatestNews'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { getActivity } from '@/lib/activity/getActivity'
import './landing.css'

export const metadata: Metadata = generateMarketingMetadata({
  title: 'Apoxer - Find Players, Join Lobbies, Discover Communities',
  description: 'Find players for any game—fast. Join short-lived lobbies, discover game communities, and make fragmented multiplayer games visible again. No Discord hunting required.',
  path: '/landing',
})

export default async function LandingPage() {
  const [activity, jsonLd] = await Promise.all([
    getActivity(),
    Promise.resolve([
      generateMarketingJsonLd(),
      generateWebSiteJsonLd(),
      generateSoftwareApplicationJsonLd(),
    ]),
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="relative z-10 min-h-screen">
        <MarketingNav />
        <main className="w-full">
          <HeroCarouselSection activity={activity} />
          <TrustBanner />
          <AccessGamesSection />
          <TrendingGames />
          <UpcomingEvents />
          <TournamentsSection />
          <FAQSection />
          <CommunityCTA />
          <LatestNews />
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}

import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  generateMarketingMetadata,
  generateMarketingJsonLd,
  generateWebSiteJsonLd,
  generateSoftwareApplicationJsonLd,
} from '@/lib/seo/marketing'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { HeroSection } from '@/components/marketing-v2/HeroSection'
import { TrustBanner } from '@/components/marketing-v2/TrustBanner'
import { PopularGames } from '@/components/marketing-v2/PopularGames'
import { FavoriteGames } from '@/components/marketing-v2/FavoriteGames'
import { DownloadApp } from '@/components/marketing-v2/DownloadApp'
import { TestimonialsSection } from '@/components/marketing-v2/TestimonialsSection'
import { PaymentMethods } from '@/components/marketing-v2/PaymentMethods'
import { GameShowcase } from '@/components/marketing-v2/GameShowcase'
import { TradeLikePro } from '@/components/marketing-v2/TradeLikePro'
import { LatestNews } from '@/components/marketing-v2/LatestNews'
import { getActivity } from '@/lib/activity/getActivity'

export const metadata: Metadata = generateMarketingMetadata({
  title: 'Apoxer - Find Players, Join Lobbies, Discover Communities',
  description: 'Find players for any game—fast. Join short-lived lobbies, discover game communities, and make fragmented multiplayer games visible again. No Discord hunting required.',
  path: '/marketing-v2',
})

export default async function MarketingV2Page() {
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
          <HeroSection activity={activity} />
          <TrustBanner />
          <PopularGames />
          <FavoriteGames />
          <DownloadApp />
          <TestimonialsSection />
          <PaymentMethods />
          <GameShowcase gameName="Counter-Strike 2" />
          <GameShowcase gameName="Team Fortress 2" />
          <GameShowcase gameName="Rust" />
          <TradeLikePro />
          <LatestNews />
        </main>
      </div>
    </>
  )
}

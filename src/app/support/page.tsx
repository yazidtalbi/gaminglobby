'use client'

import { useState } from 'react'
import { ExpandMore, Search, HelpOutline } from '@mui/icons-material'
import Link from 'next/link'

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const categories = [
    {
      title: 'Getting Started',
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'Click "Sign In" in the top right corner and create an account using email authentication. It\'s free and takes less than a minute. You\'ll need to verify your email address before you can start using all features.'
        },
        {
          question: 'Do I need to download anything?',
          answer: 'No! Apoxer is a web-based platform that works directly in your browser. You can access it from any device - desktop, tablet, or mobile - without installing any software. We recommend using a modern browser like Chrome, Firefox, Safari, or Edge for the best experience.'
        },
        {
          question: 'Is Apoxer available in my country?',
          answer: 'Yes! Apoxer is available worldwide. You can use the platform from anywhere, though some features like payment processing may vary by region. All content is available globally, and we support multiple languages.'
        },
        {
          question: 'What browsers are supported?',
          answer: 'Apoxer works best on modern browsers including Google Chrome, Mozilla Firefox, Safari, and Microsoft Edge. We recommend using the latest version of your browser for optimal performance and security.'
        }
      ]
    },
    {
      title: 'Account & Profile',
      faqs: [
        {
          question: 'How do I change my username?',
          answer: 'Your username is set when you create your account and cannot be changed directly. If you need to change your username, please contact our support team with your request and reason. Usernames must be unique and follow our community guidelines.'
        },
        {
          question: 'Can I change my email address?',
          answer: 'Yes, you can update your email address from your account settings page. You\'ll need to verify your new email address before it becomes active. Make sure to use an email address you have access to, as it\'s used for account recovery and notifications.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'To delete your account, go to Settings and scroll to the "Account" section. Click "Delete Account" and follow the prompts. This action is permanent and cannot be undone. All your data, including lobbies, messages, and profile information, will be permanently deleted.'
        },
        {
          question: 'Can I make my profile private?',
          answer: 'Yes, you can set your profile to private in your profile settings. Private profiles are only visible to users you follow or who follow you. Your profile will not appear in public searches, but you can still participate in lobbies and events normally.'
        },
        {
          question: 'How do I upload a profile picture or banner?',
          answer: 'Go to your profile page and click "Edit Profile". From there, you can upload a profile picture (avatar) and a cover image (banner). Supported formats include JPG, PNG, and GIF. Images are automatically resized and optimized. Pro users can upload custom banners, while free users can choose from preset options.'
        }
      ]
    },
    {
      title: 'Lobbies & Matchmaking',
      faqs: [
        {
          question: 'How many lobbies can I be in at once?',
          answer: 'You can only be in one active lobby at a time (either hosting or as a member). If you try to join a new lobby, you\'ll automatically leave your current one. This ensures you can focus on one gaming session at a time.'
        },
        {
          question: 'What happens if I leave a lobby?',
          answer: 'When you leave a lobby, you\'ll be removed from the member list immediately. You can then join or create a new lobby. If you were the host, the lobby will close automatically. All chat messages remain visible to other members who were in the lobby.'
        },
        {
          question: 'How do I invite players to my lobby?',
          answer: 'You can invite players in several ways: 1) Click "Invite to Lobby" on their profile page, 2) Use the auto-invite feature (Pro users only) to automatically invite online players with the same game, 3) Share your lobby link directly with friends.'
        },
        {
          question: 'Can I kick or ban players from my lobby?',
          answer: 'Yes, if you\'re the host, you can kick or ban players from your lobby using the member management controls. Kicked players can rejoin if the lobby is still open, but banned players cannot rejoin until you unban them or the lobby closes.'
        },
        {
          question: 'How does the ready system work?',
          answer: 'The ready system helps coordinate with your teammates. Each member can toggle their ready status. The lobby header shows how many members are ready. This is useful for competitive games where you want to ensure everyone is prepared before starting.'
        },
        {
          question: 'What platforms are supported?',
          answer: 'Apoxer supports all major gaming platforms: PC (Windows, Mac, Linux), PlayStation (PS4, PS5), Xbox (Xbox One, Series X/S), Nintendo Switch, Mobile (iOS, Android), and Other. You can filter lobbies and events by platform to find matches for your specific platform.'
        },
        {
          question: 'How does auto-invite work?',
          answer: 'Auto-invite (Pro feature) automatically finds and invites other online players who have added the same game to their library. The system matches players based on game, platform preference, and online status. You can enable it when creating a lobby, and it will send invites to eligible players automatically.'
        }
      ]
    },
    {
      title: 'Events & Communities',
      faqs: [
        {
          question: 'How do weekly community events work?',
          answer: 'Each week, the community votes on games they want to play together. You can vote for multiple games and choose your preferred time slots and days. The top-voted games become 6-hour events where players can join and participate. Events are scheduled based on the most popular time preferences.'
        },
        {
          question: 'Can I create my own events?',
          answer: 'Yes, Pro users can create and manage their own gaming events. Free users can participate in all events but cannot create them. When creating an event, you can set the game, time, duration, and description. Pro users can also feature their events to get more visibility.'
        },
        {
          question: 'How are event times determined?',
          answer: 'Event times are determined by analyzing all votes from the community. The system identifies the most popular time slot and day preferences, then schedules events accordingly. For Pro-created events, the creator sets the time.'
        },
        {
          question: 'What happens if an event is cancelled?',
          answer: 'If an event is cancelled, all participants will be notified. You\'ll receive a notification and can see the cancellation status on the event page. Your participation status will be updated automatically.'
        },
        {
          question: 'How do I join a community?',
          answer: 'Communities are game-specific resources like Discord servers or forums. You can find communities on each game\'s page. Click on a community to view its details and join the external platform (Discord, etc.). Communities are managed by their respective owners.'
        }
      ]
    },
    {
      title: 'Premium & Billing',
      faqs: [
        {
          question: 'What\'s included in the Pro plan?',
          answer: 'Pro includes: auto-invite system, event creation and management, custom profile banners, Pro badge, lobby boosts, advanced filters, library insights, and upcoming collections feature. See the billing page for a complete comparison.'
        },
        {
          question: 'How do I upgrade to Pro?',
          answer: 'Visit the Billing page and click "Upgrade to Pro". You\'ll be redirected to a secure checkout process powered by Stripe. Enter your payment information and complete the purchase. Your Pro features will be activated immediately.'
        },
        {
          question: 'Can I cancel my Pro subscription anytime?',
          answer: 'Yes, you can cancel your Pro subscription at any time from your account settings. Your Pro features will remain active until the end of your current billing period. After cancellation, you\'ll automatically revert to the Free plan when your subscription expires.'
        },
        {
          question: 'Do you offer refunds?',
          answer: 'We offer refunds on a case-by-case basis. If you\'re not satisfied with Pro, contact our support team within 14 days of your purchase. Refunds are processed to your original payment method and may take 5-10 business days to appear.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through Stripe. Payment methods vary by country, and Stripe will show you the available options during checkout.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely. All payments are processed securely through Stripe, a leading payment processor. We never store your credit card information on our servers. All payment data is encrypted and handled by Stripe\'s secure, PCI-compliant infrastructure.'
        },
        {
          question: 'Will I be charged automatically?',
          answer: 'Yes, Pro subscriptions are billed monthly on a recurring basis. You\'ll be charged automatically each month unless you cancel your subscription. You can manage your subscription and billing preferences from your account settings.'
        }
      ]
    },
    {
      title: 'Technical Support',
      faqs: [
        {
          question: 'Does Apoxer work on mobile?',
          answer: 'Yes! Apoxer is fully responsive and works on desktop, tablet, and mobile devices. You can access all features from any device with a web browser. We recommend using a modern mobile browser for the best experience.'
        },
        {
          question: 'How does real-time chat work?',
          answer: 'Apoxer uses Supabase Realtime to provide instant messaging in lobbies. Messages appear instantly for all members without page refreshes. The system maintains message history and syncs across all devices automatically.'
        },
        {
          question: 'Why isn\'t my lobby updating in real-time?',
          answer: 'Real-time updates require an active internet connection. If updates aren\'t appearing, try: 1) Refreshing the page, 2) Checking your internet connection, 3) Clearing your browser cache, 4) Disabling browser extensions that might interfere. If issues persist, contact support.'
        },
        {
          question: 'What games are supported?',
          answer: 'Apoxer supports over 50,000 games from SteamGridDB\'s database. If a game exists on SteamGridDB, you can search for it and create lobbies for it. We continuously update our game database to include new releases.'
        },
        {
          question: 'How do I report a bug?',
          answer: 'To report a bug, contact our support team with: 1) A description of the issue, 2) Steps to reproduce it, 3) Your browser and device information, 4) Screenshots if applicable. We review all bug reports and work to fix issues as quickly as possible.'
        },
        {
          question: 'Why can\'t I see some features?',
          answer: 'Some features may be Pro-only, require account verification, or may be temporarily unavailable. Check your account status and subscription level. If you believe you should have access to a feature, contact support for assistance.'
        }
      ]
    },
    {
      title: 'Privacy & Safety',
      faqs: [
        {
          question: 'Is my data safe?',
          answer: 'Yes, we use industry-standard security practices and Supabase\'s secure infrastructure. Your password is encrypted and we never store sensitive payment information (handled by Stripe). We follow GDPR and other privacy regulations to protect your data.'
        },
        {
          question: 'How do I report a user?',
          answer: 'Visit the user\'s profile page and click the "Report User" button. You can select a reason (harassment, spam, inappropriate content, etc.) and provide additional details. Our moderation team reviews all reports and takes appropriate action.'
        },
        {
          question: 'What happens when I report someone?',
          answer: 'When you report a user, our moderation team reviews the report. If the user violates our community guidelines, we may issue warnings, suspend, or ban their account. You\'ll be notified of the outcome if action is taken. False reports may result in consequences for the reporter.'
        },
        {
          question: 'How do you handle harassment?',
          answer: 'We take harassment seriously. If you experience harassment, report the user immediately. Our moderation team investigates all reports and takes swift action. You can also block users to prevent them from contacting you. We have a zero-tolerance policy for harassment.'
        },
        {
          question: 'Can I block users?',
          answer: 'Yes, you can block users from their profile page. Blocked users cannot message you, invite you to lobbies, or see your profile. You can manage your blocked users list from your account settings.'
        },
        {
          question: 'What data do you collect?',
          answer: 'We collect data necessary to provide our services: account information, game preferences, lobby participation, and usage analytics. We never sell your personal data. See our Privacy Policy for complete details on data collection and usage.'
        }
      ]
    }
  ]

  const allFaqs = categories.flatMap(category => category.faqs)
  const filteredFaqs = searchQuery
    ? allFaqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFaqs

  const getCategoryForFaq = (faqIndex: number) => {
    let index = 0
    for (const category of categories) {
      if (faqIndex < index + category.faqs.length) {
        return category.title
      }
      index += category.faqs.length
    }
    return ''
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-left">
          <h1 className="text-5xl font-title text-white mb-4">Support Center</h1>
          <p className="text-lg text-slate-300 mb-6 max-w-xl">
            Find answers to common questions and get help with Apoxer
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-cyan-500/30 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="mb-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`#category-${index}`}
                className="bg-slate-800 border border-cyan-500/30 p-6 hover:bg-slate-800/50 transition-colors"
              >
                <HelpOutline className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-lg font-title text-white mb-2">{category.title}</h3>
                <p className="text-sm text-slate-400">{category.faqs.length} articles</p>
              </Link>
            ))}
          </div>
        )}

        {/* FAQs */}
        {searchQuery ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-title text-white mb-4">
              Search Results ({filteredFaqs.length})
            </h2>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const originalIndex = allFaqs.indexOf(faq)
                return (
                  <div key={index} className="bg-slate-800 border border-cyan-500/30">
                    <button
                      onClick={() => toggleFaq(originalIndex)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="text-xs text-cyan-400 mb-1 block">{getCategoryForFaq(originalIndex)}</span>
                        <span className="text-white font-title">{faq.question}</span>
                      </div>
                      <ExpandMore className={`w-5 h-5 text-slate-400 transition-transform ml-4 flex-shrink-0 ${expandedFaq === originalIndex ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFaq === originalIndex && (
                      <div className="p-4 pt-0 text-slate-300 border-t border-cyan-500/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="bg-slate-800 border border-cyan-500/30 p-8 text-center">
                <p className="text-slate-400">No results found. Try different keywords or browse categories above.</p>
              </div>
            )}
          </div>
        ) : (
          categories.map((category, categoryIndex) => (
            <section key={categoryIndex} id={`category-${categoryIndex}`} className="mb-12">
              <h2 className="text-3xl font-title text-white mb-6">{category.title}</h2>
              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = categories.slice(0, categoryIndex).reduce((sum, cat) => sum + cat.faqs.length, 0) + faqIndex
                  return (
                    <div key={faqIndex} className="bg-slate-800 border border-cyan-500/30">
                      <button
                        onClick={() => toggleFaq(globalIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-white font-title pr-4">{faq.question}</span>
                        <ExpandMore className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${expandedFaq === globalIndex ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedFaq === globalIndex && (
                        <div className="p-4 pt-0 text-slate-300 border-t border-cyan-500/30">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}

        {/* Contact Support */}
        <section className="mt-12 bg-slate-800 border border-cyan-500/30 p-8 text-center">
          <h2 className="text-2xl font-title text-white mb-4">Still need help?</h2>
          <p className="text-slate-300 mb-6">
            Can't find what you're looking for? Contact our support team and we'll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/billing"
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-title transition-colors inline-block"
            >
              View Billing FAQ
            </Link>
            <a
              href="mailto:support@apoxer.com"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-title transition-colors inline-block border border-slate-600"
            >
              Contact Support
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}


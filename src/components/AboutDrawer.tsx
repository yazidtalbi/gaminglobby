'use client'

import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function AboutDrawer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-w-2xl">
        <div className="min-h-screen pt-4 lg:pt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Hero Section */}
            <div className="mb-12 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-title text-white mb-6 leading-tight">
                About Apoxer
              </h1>
              <div className="mb-8 max-w-3xl   ">
                <p className="text-base text-white leading-relaxed mb-4">
                  Apoxer started as a small tool I built for myself — a way to see who's online right now, join short-lived lobbies around a game, and connect with players without hunting through dead links.
                </p>
                <p className="text-base text-slate-300 leading-relaxed">
                  It's not about replacing communities.
                </p>
                <p className="text-base text-cyan-400 leading-relaxed">
                  It's about making them visible again.
                </p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-4 leading-tight">
                  Manifesto
                </h2>
                <p className="text-base text-slate-300 max-w-3xl leading-relaxed mb-4">
                  Communities are scattered across Discord servers, dead forums, broken links, and private groups. Apoxer makes it easy to find players and form lobbies—right now.
                </p>
                <p className="text-base text-slate-300 max-w-3xl leading-relaxed mb-4">
                  I've been replaying games I love lately — TF2, Battlefield 3, even older console titles — and I kept running into the same problem: finding people to actually play with is still way harder than it should be.
                </p>
                <p className="text-base text-slate-300 max-w-3xl leading-relaxed mb-4">
                  Communities are scattered across random Discord servers, abandoned forums, expired invite links, and private groups. When official servers shut down, the community often disappears with them.
                </p>
                <p className="text-base text-slate-400 font-medium italic leading-relaxed">
                  Games get preserved.
                  <br />
                  Their communities don't.
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-700/50 my-12" />

            {/* Who is it for? */}
            <section className="mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-4 leading-tight">
                  Who is it for?
                </h2>
                <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
                  Gamers who struggle to find active players, especially for niche, older, or less-popular multiplayer games.
                </p>
              </div>
            </section>

            {/* Separator */}
            <div className="border-t border-slate-700/50 my-12" />

            {/* Why is it different? */}
            <section className="mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-4 leading-tight">
                  Why is it different?
                </h2>
                <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
                  Game-agnostic and lobby-based. No server hunting. No Discord chaos. Just players gathering around games.
                </p>
              </div>
            </section>

            {/* Separator */}
            <div className="border-t border-slate-700/50 my-12" />

            {/* What can I do now? */}
            <section className="mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-title text-slate-200 mb-6 leading-tight">
                  What can I do now?
                </h2>
                <div className="space-y-0 max-w-3xl">
                  {/* Create or join lobbies */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/lobbies.png" 
                          alt="Lobbies"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">🎮</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Create or join lobbies</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Find players for any game and start playing immediately. Browse active lobbies or create your own.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time chat */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/chat.png" 
                          alt="Real-time chat"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">💬</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Real-time chat</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Chat with players in real-time using lobby chat. Coordinate strategies and connect with your team instantly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/events.png" 
                          alt="Events"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">📅</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Discover and join events</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Join events scheduled around specific games. Plan ahead and gather with other players at set times.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tournaments */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/tournaments.png" 
                          alt="Tournaments"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">🏆</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Participate in tournaments</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Compete in tournaments and earn rankings. Show your skills and climb the leaderboards.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Follow players */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/follow.png" 
                          alt="Follow players"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">👥</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Build your gaming network</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Follow other players and build connections. Create a network of gamers to play with regularly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Invite players */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/invite.png" 
                          alt="Invite players"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">✉️</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Invite friends to lobbies</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Invite friends and followed players to your lobbies. Make it easy to gather your squad.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Browse games */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/games.png" 
                          alt="Browse games"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">🎯</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Browse thousands of games</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Search and discover games across all platforms. Find players for any title, from classics to new releases.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Game library */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/library.png" 
                          alt="Game library"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">📚</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Build your game library</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Add your favorite games and quickmatch instantly. Keep your library organized and accessible.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Communities & guides */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/communities.png" 
                          alt="Communities"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">🌐</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Find gaming communities</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Discover Discord servers, Mumble communities, and guides for any game. Connect with dedicated communities.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent players */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/recent-players.png" 
                          alt="Recent players"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">👤</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">View recent players</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          See players you've encountered in previous lobbies. Reconnect with familiar faces easily.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile customization */}
                  <div className="border-t border-slate-700/50 pt-6 pb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16">
                        <img 
                          src="/features/profile.png" 
                          alt="Profile"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-2xl">⭐</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-title text-white font-bold mb-2">Customize your profile</h3>
                        <p className="text-base text-slate-300 leading-relaxed">
                          Create and personalize your profile with badges and endorsements. Showcase your achievements.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="border-t border-slate-700/50 my-12" />

            {/* What is Apoxer? */}
            <section className="mb-12">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-title text-white mb-3">What is Apoxer?</h3>
                <p className="text-base text-slate-300 leading-relaxed">
                  A lobby-first matchmaking platform that helps players find people to play with — across thousands of games.
                </p>
              </div>
            </section>

            {/* Separator */}
            {!user && (
              <>
                <div className="border-t border-slate-700/50 my-12" />

                {/* CTAs - Only show if user is not signed in */}
                <section className="mb-12">
                  <div className="flex justify-center">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-title text-lg transition-colors rounded-lg"
                    >
                      Join now
                    </Link>
                  </div>
                </section>

                {/* Separator */}
                <div className="border-t border-slate-700/50 my-12" />
              </>
            )}

            {/* Trust Note */}
            <div className="max-w-3xl">
              <p className="text-sm text-slate-400 leading-relaxed">
                Apoxer is still early. If you join and something feels missing, that's intentional — it's built around real usage, not assumptions.
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

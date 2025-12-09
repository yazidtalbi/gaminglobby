# LobbyHub - Gaming Matchmaking App

A lobby-focused matchmaking app for games built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎮 **Game Discovery** - Search any game using SteamGridDB integration
- 🏠 **Lobby System** - Create and join game lobbies with real-time chat
- 👥 **Social Features** - Follow players and invite them to lobbies
- 📚 **Game Resources** - Communities (Discord, Mumble, etc.) and guides per game
- 🎨 **Modern UI** - Beautiful, responsive design with dark theme

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **Game Data**: SteamGridDB API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- SteamGridDB API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd gaming
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Then fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STEAMGRIDDB_API_BASE=https://www.steamgriddb.com/api/v2
STEAMGRIDDB_API_KEY=your_steamgriddb_api_key
```

4. Set up the database:

Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

5. Enable Realtime in Supabase:

Make sure the following tables have realtime enabled:
- lobbies
- lobby_members
- lobby_messages
- lobby_invites

6. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── steamgriddb/   # SteamGridDB proxy routes
│   │   └── guides/        # Guide OG metadata fetching
│   ├── auth/              # Authentication pages
│   ├── games/             # Game browser and detail pages
│   ├── lobbies/           # Lobby pages
│   ├── u/                 # User profile pages
│   └── invites/           # Lobby invites page
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   └── supabase/          # Supabase client setup
└── types/                 # TypeScript types
```

## Key Features

### Game Search

- Typeahead search using SteamGridDB
- Server-side API calls to protect API key
- Vertical/portrait game covers preferred

### Lobby System

- One active lobby per user (hosting or membership)
- Real-time chat with Supabase Realtime
- Platform selection (PC, PlayStation, Xbox, etc.)
- Discord link integration
- Attach guides to lobbies

### Auto-Close Inactive Lobbies

- Lobbies auto-close after 1 hour of host inactivity
- Host activity is tracked via `last_active_at`
- Clients subscribe to lobby status changes

### Social Features

- Follow/unfollow other players
- Invite followed users to lobbies
- View followers and following counts

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema including:

- `profiles` - User profiles
- `user_games` - User game libraries
- `follows` - Follow relationships
- `lobbies` - Game lobbies
- `lobby_members` - Lobby membership
- `lobby_messages` - Chat messages
- `lobby_invites` - Lobby invitations
- `game_communities` - Discord/Mumble communities
- `game_guides` - User-submitted guides
- `game_search_events` - Search analytics

## License

MIT
# gaminglobby
# gaminglobby

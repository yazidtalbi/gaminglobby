# GameLobby - Find Your Squad

A lobby-focused matchmaking platform for gamers built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- 🎮 **Game Search** - Search any game using SteamGridDB with real-time typeahead
- 🏠 **Lobbies** - Create, join, and manage game lobbies
- 💬 **Real-time Chat** - Built-in lobby chat powered by Supabase Realtime
- 👥 **Social Features** - Follow players and invite them to your lobbies
- 🎯 **Profile & Library** - Build your gaming profile and showcase your games
- 🌐 **Communities** - Discover and share Discord servers, Mumble servers, and other community links
- 📊 **Game Stats** - Track player counts and search trends

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Game Data**: SteamGridDB API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project
- A SteamGridDB API key

### 1. Clone and Install

```bash
cd gaming
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# SteamGridDB Configuration (server-only)
STEAMGRIDDB_API_BASE=https://www.steamgriddb.com/api/v2
STEAMGRIDDB_API_KEY=your-steamgriddb-api-key
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration script from `supabase/migrations/001_initial_schema.sql`

This will create all the required tables:
- `profiles` - User profiles
- `user_games` - User game libraries
- `follows` - Social follows
- `lobbies` - Game lobbies
- `lobby_members` - Lobby membership
- `lobby_messages` - Lobby chat messages
- `lobby_invites` - Lobby invitations
- `game_communities` - Game community links
- `game_search_events` - Search analytics

### 4. Enable Realtime

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable replication for:
   - `lobby_messages`
   - `lobby_members`
   - `lobby_invites`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── steamgriddb/   # SteamGridDB proxy endpoints
│   │   └── search-events/ # Analytics endpoint
│   ├── auth/              # Login & Register pages
│   ├── games/             # Games browser & detail pages
│   ├── lobbies/           # Lobby pages
│   └── u/                 # User profile pages
├── components/            # React components
│   ├── GameSearch.tsx     # Typeahead search component
│   ├── LobbyChat.tsx      # Real-time chat component
│   ├── LobbyCard.tsx      # Lobby preview card
│   └── ...
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and clients
│   ├── supabase/          # Supabase client setup
│   └── steamgriddb.ts     # SteamGridDB API functions
└── types/                 # TypeScript types
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/steamgriddb/search` | GET | Search games by query |
| `/api/steamgriddb/game` | GET | Get game details by ID |
| `/api/search-events` | POST | Log search analytics |

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with search and trending games |
| `/games` | Game browser |
| `/games/[gameId]` | Game details, lobbies, and communities |
| `/lobbies/[lobbyId]` | Lobby view with chat and members |
| `/u/[id]` | User profile |
| `/u/[id]/invites` | User's pending lobby invites |
| `/auth/login` | Login page |
| `/auth/register` | Registration page |

## Features Deep Dive

### Game Search (SteamGridDB)

The app uses SteamGridDB for game data. All API calls are proxied through Next.js route handlers to keep the API key secure:

```typescript
// Client-side usage
const response = await fetch(`/api/steamgriddb/search?query=${query}`)
const { games } = await response.json()
```

### Real-time Chat

Lobby chat uses Supabase Realtime for instant message delivery:

```typescript
const channel = supabase
  .channel(`lobby_messages_${lobbyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'lobby_messages',
    filter: `lobby_id=eq.${lobbyId}`,
  }, handleNewMessage)
  .subscribe()
```

### Follow System

Users can follow each other to:
- See their profiles
- Invite them to lobbies
- Build a gaming network

## Customization

### Styling

The app uses Tailwind CSS with a custom dark theme. Key colors:
- Primary: Emerald (`emerald-500`)
- Background: Zinc (`zinc-950`)
- Surface: Zinc (`zinc-900`)

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/app/`
3. Update types in `src/types/database.ts`
4. Add migrations in `supabase/migrations/`

## Production Deployment

1. Set all environment variables in your deployment platform
2. Run the Supabase migration in your production database
3. Deploy:

```bash
npm run build
npm start
```

## Getting SteamGridDB API Key

1. Go to [SteamGridDB](https://www.steamgriddb.com/)
2. Create an account
3. Go to Settings → API Keys
4. Generate a new API key

## License

MIT

## Contributing

Pull requests welcome! Please read the contributing guidelines first.
# gaming

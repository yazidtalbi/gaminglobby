# Database Seeders

This directory contains TypeScript seeders for populating the database with test data.

## Prerequisites

1. Make sure you have the following environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (bypasses RLS)
   - `STEAMGRIDDB_API_KEY` (optional) - For fetching game names

2. Install dependencies:
   ```bash
   npm install
   ```

## Available Seeders

### 1. User Seeder (`seed-users.ts`)

Creates a user with a profile, games, and optional pro subscription.

**Usage:**
```bash
npm run seed:user
```

**Features:**
- Customizable username, display name, bio
- Avatar and banner/cover URLs
- Free or Pro plan selection
- Plan expiration date (for Pro users)
- Add multiple games to user library
- Automatically creates auth user

**Example:**
```
Username: testuser
Display Name: Test User
Bio: Gaming enthusiast
Avatar URL: https://example.com/avatar.jpg
Banner/Cover URL: https://example.com/banner.jpg
Plan Tier (free/pro): pro
Plan Expires At: 2025-12-31
Game IDs: 730,1234,5678
```

### 2. Lobby Seeder (`seed-lobbies.ts`)

Creates a lobby for a selected user and game.

**Usage:**
```bash
npm run seed:lobby
```

**Features:**
- Select user from a list of existing users
- Specify game ID (SteamGridDB ID)
- Custom lobby title and description
- Platform selection (pc, ps, xbox, switch, mobile, other)
- Max players, Discord link
- Status selection (open, in_progress, closed)
- Automatically fetches game name from SteamGridDB

**Example:**
```
Select user: 1
Game ID: 730
Lobby Title: CS2 Competitive
Description: Looking for skilled players
Platform: pc
Max Players: 5
Discord Link: https://discord.gg/...
Status: open
```

### 3. Event Seeder (`seed-events.ts`)

Creates an event for a selected user and game with auto-generated info.

**Usage:**
```bash
npm run seed:event
```

**Features:**
- Select user from a list of existing users
- Specify game ID (SteamGridDB ID)
- Auto-generates:
  - Time slot (morning, noon, afternoon, evening, late_night)
  - Start/end dates (random future dates)
  - Status (scheduled or ongoing)
  - Vote count (random 5-55)
- Automatically creates/uses weekly round
- Automatically creates/uses game event community
- Option to add user as participant

**Example:**
```
Select user: 1
Game ID: 730
Add user as participant? (y/n): y
```

## Notes

- All seeders use the Supabase service role key to bypass Row Level Security (RLS)
- The user seeder creates both an auth user and a profile
- The lobby seeder automatically adds the host as a lobby member (via trigger)
- The event seeder creates necessary dependencies (rounds, communities) if they don't exist
- Game names are automatically fetched from SteamGridDB if an API key is provided

## Troubleshooting

1. **"Missing Supabase environment variables"**
   - Make sure `.env.local` exists and contains the required variables
   - Check that `SUPABASE_SERVICE_ROLE_KEY` is set (not the anon key)

2. **"No users found"**
   - Run the user seeder first to create users
   - Make sure users exist in the `profiles` table

3. **"Username already exists"**
   - Choose a different username
   - Or manually delete the existing user from Supabase dashboard

4. **Game name shows as "Game {id}"**
   - This is normal if SteamGridDB API key is not set
   - Or if the game ID doesn't exist in SteamGridDB


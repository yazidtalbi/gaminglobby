# Tournaments Implementation Guide

## Overview
This document outlines the implementation plan for a tournament system in the Apoxer gaming platform. Tournaments will allow users to create, join, and participate in competitive gaming events with brackets, matches, and prizes.

## Database Schema

### 1. Tournaments Table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  hero_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'registration_closed', 'in_progress', 'completed', 'cancelled')),
  format TEXT NOT NULL DEFAULT 'single_elimination' CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  max_participants INTEGER NOT NULL DEFAULT 16 CHECK (max_participants > 0),
  current_participants INTEGER NOT NULL DEFAULT 0,
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  prize_pool DECIMAL(10, 2) DEFAULT 0,
  prize_distribution JSONB, -- e.g., {"1": 0.5, "2": 0.3, "3": 0.2}
  platform TEXT NOT NULL DEFAULT 'pc',
  start_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  check_in_required BOOLEAN DEFAULT false,
  check_in_deadline TIMESTAMPTZ,
  rules TEXT,
  discord_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_game_id ON tournaments(game_id);
CREATE INDEX idx_tournaments_host_id ON tournaments(host_id);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
```

### 2. Tournament Participants Table
```sql
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_name TEXT, -- Optional, for team tournaments
  seed INTEGER, -- For bracket seeding
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'disqualified', 'withdrawn')),
  checked_in_at TIMESTAMPTZ,
  final_placement INTEGER, -- Final ranking (1, 2, 3, etc.)
  prize_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);
```

### 3. Tournament Matches Table
```sql
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL, -- Match number within the round
  bracket_position TEXT, -- e.g., "upper_1", "lower_2", "final"
  participant1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'forfeited')),
  scheduled_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE SET NULL, -- Link to game lobby
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, round_number, match_number)
);

CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX idx_tournament_matches_participant1_id ON tournament_matches(participant1_id);
CREATE INDEX idx_tournament_matches_participant2_id ON tournament_matches(participant2_id);
```

### 4. Tournament Brackets Table (for visualization)
```sql
CREATE TABLE tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  bracket_data JSONB NOT NULL, -- Complete bracket structure
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id)
);

CREATE INDEX idx_tournament_brackets_tournament_id ON tournament_brackets(tournament_id);
```

### 5. RLS Policies
```sql
-- Tournaments: Public read, authenticated write
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Users can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own tournaments"
  ON tournaments FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own tournaments"
  ON tournaments FOR DELETE
  USING (auth.uid() = host_id);

-- Tournament Participants: Public read, authenticated write
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament participants are viewable by everyone"
  ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can register for tournaments"
  ON tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON tournament_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Tournament Matches: Public read, host/admin write
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament matches are viewable by everyone"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Tournament hosts can manage matches"
  ON tournament_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_matches.tournament_id
      AND tournaments.host_id = auth.uid()
    )
  );
```

## API Routes

### 1. GET /api/tournaments
List tournaments with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status (draft, open, in_progress, completed)
- `game_id`: Filter by game
- `platform`: Filter by platform
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "tournaments": [
    {
      "id": "uuid",
      "host_id": "uuid",
      "host": {
        "username": "string",
        "avatar_url": "string"
      },
      "game_id": "string",
      "game_name": "string",
      "title": "string",
      "description": "string",
      "status": "open",
      "format": "single_elimination",
      "max_participants": 16,
      "current_participants": 8,
      "entry_fee": 10.00,
      "prize_pool": 160.00,
      "platform": "pc",
      "start_date": "2024-01-15T18:00:00Z",
      "registration_deadline": "2024-01-15T17:00:00Z",
      "cover_url": "string",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### 2. GET /api/tournaments/[id]
Get tournament details including participants and bracket.

**Response:**
```json
{
  "tournament": {
    "id": "uuid",
    "host_id": "uuid",
    "host": {...},
    "game_id": "string",
    "game_name": "string",
    "title": "string",
    "description": "string",
    "status": "open",
    "format": "single_elimination",
    "max_participants": 16,
    "current_participants": 8,
    "entry_fee": 10.00,
    "prize_pool": 160.00,
    "prize_distribution": {"1": 0.5, "2": 0.3, "3": 0.2},
    "platform": "pc",
    "start_date": "2024-01-15T18:00:00Z",
    "registration_deadline": "2024-01-15T17:00:00Z",
    "check_in_required": true,
    "check_in_deadline": "2024-01-15T17:30:00Z",
    "rules": "string",
    "discord_link": "string",
    "participants": [...],
    "bracket": {...},
    "matches": [...],
    "created_at": "2024-01-01T12:00:00Z"
  },
  "user_participation": {
    "is_registered": true,
    "is_checked_in": false,
    "status": "registered"
  }
}
```

### 3. POST /api/tournaments
Create a new tournament.

**Authorization:**
- Free users: Can only create free tournaments (entry_fee = 0), max 16 participants, max 2 active tournaments
- Premium users: Can create paid tournaments, up to 64 participants (128 for founders), unlimited tournaments

**Request Body:**
```json
{
  "game_id": "string",
  "game_name": "string",
  "title": "string",
  "description": "string",
  "format": "single_elimination",
  "max_participants": 16,
  "entry_fee": 10.00,
  "platform": "pc",
  "start_date": "2024-01-15T18:00:00Z",
  "registration_deadline": "2024-01-15T17:00:00Z",
  "check_in_required": true,
  "check_in_deadline": "2024-01-15T17:30:00Z",
  "rules": "string",
  "discord_link": "string",
  "prize_distribution": {"1": 0.5, "2": 0.3, "3": 0.2}
}
```

**Response (Success):**
```json
{
  "tournament": {...},
  "message": "Tournament created successfully"
}
```

**Response (Error - Free user trying to create paid tournament):**
```json
{
  "error": "Premium subscription required to create paid tournaments",
  "code": "PREMIUM_REQUIRED"
}
```

**Response (Error - Exceeded active tournament limit):**
```json
{
  "error": "Free users can have maximum 2 active tournaments",
  "code": "TOURNAMENT_LIMIT_EXCEEDED"
}
```

### 4. PUT /api/tournaments/[id]
Update tournament (host only).

### 5. DELETE /api/tournaments/[id]
Cancel/delete tournament (host only).

### 6. POST /api/tournaments/[id]/register
Register for a tournament.

**Response:**
```json
{
  "participant": {...},
  "message": "Successfully registered for tournament"
}
```

### 7. POST /api/tournaments/[id]/check-in
Check in for a tournament (if check-in required).

### 8. POST /api/tournaments/[id]/withdraw
Withdraw from a tournament.

### 9. POST /api/tournaments/[id]/start
Start tournament and generate bracket (host only).

### 10. POST /api/tournaments/[id]/matches/[matchId]/result
Report match result (host/participants).

**Request Body:**
```json
{
  "winner_id": "uuid",
  "score1": 2,
  "score2": 1,
  "notes": "string"
}
```

### 11. GET /api/tournaments/[id]/bracket
Get tournament bracket visualization data.

## Frontend Components

### 1. TournamentCard Component
Display tournament in list/grid view.

**Props:**
- `tournament`: Tournament object
- `onClick`: Click handler
- `showHost`: Show host info (default: true)

**Features:**
- Tournament status badge
- Participant count
- Prize pool display
- Entry fee
- Start date/time
- Quick register button (if open)

### 2. TournamentDetailPage
Full tournament page (`/tournaments/[id]`).

**Sections:**
- Header with cover image, title, game info
- Tournament info (format, participants, prize pool, dates)
- Registration section (if open)
- Participants list
- Bracket visualization
- Matches schedule/results
- Rules and Discord link

### 3. TournamentBracket Component
Visual bracket display (single/double elimination, round robin).

**Features:**
- Interactive bracket
- Match results
- Progress indicators
- Responsive design (horizontal scroll on mobile)

### 4. CreateTournamentModal
Modal for creating/editing tournaments.

**Fields:**
- Game selection (search)
- Title
- Description
- Format (single/double elimination, round robin, swiss)
- Max participants (8, 16, 32, 64)
- Entry fee
- Platform
- Start date/time
- Registration deadline
- Check-in required
- Check-in deadline
- Prize distribution
- Rules
- Discord link

### 5. TournamentRegistration Component
Registration and check-in UI.

**Features:**
- Register button
- Check-in button (if required)
- Withdraw button
- Registration status
- Participant list

### 6. TournamentMatchCard Component
Display individual match in bracket/schedule.

**Features:**
- Participant names/avatars
- Match status
- Score display
- Scheduled time
- Link to lobby (if created)

## Pages

### 1. /tournaments
Tournament listing page.

**Features:**
- Filter by status, game, platform
- Search tournaments
- Sort by date, participants, prize pool
- Grid/list view toggle
- Pagination

### 2. /tournaments/[id]
Tournament detail page.

**Features:**
- All tournament information
- Registration/check-in
- Bracket visualization
- Match schedule
- Participants list
- Chat/discussion (optional)

### 3. /tournaments/create
Create tournament page (or modal).

## Bracket Generation Logic

### Single Elimination
```typescript
function generateSingleEliminationBracket(participants: Participant[]): Bracket {
  const rounds = Math.ceil(Math.log2(participants.length));
  const bracket: Bracket = {
    rounds: [],
    matches: []
  };

  // First round: all participants
  const firstRoundMatches = [];
  for (let i = 0; i < participants.length; i += 2) {
    firstRoundMatches.push({
      participant1: participants[i],
      participant2: participants[i + 1] || null, // Bye if odd number
      round: 1,
      matchNumber: Math.floor(i / 2) + 1
    });
  }
  bracket.rounds.push({ roundNumber: 1, matches: firstRoundMatches });

  // Subsequent rounds: winners advance
  for (let round = 2; round <= rounds; round++) {
    const previousRound = bracket.rounds[round - 2];
    const currentRoundMatches = [];
    for (let i = 0; i < previousRound.matches.length; i += 2) {
      currentRoundMatches.push({
        participant1: null, // Will be winner of previous match
        participant2: null,
        round: round,
        matchNumber: Math.floor(i / 2) + 1,
        dependsOn: [
          { round: round - 1, match: i + 1 },
          { round: round - 1, match: i + 2 }
        ]
      });
    }
    bracket.rounds.push({ roundNumber: round, matches: currentRoundMatches });
  }

  return bracket;
}
```

### Double Elimination
More complex - requires upper and lower brackets.

### Round Robin
All participants play each other once.

### Swiss
Multiple rounds with pairing based on current standings.

## Real-time Features

### 1. Tournament Updates
Subscribe to tournament changes:
- Status changes
- Participant registration/withdrawal
- Check-in status
- Match results

### 2. Match Updates
Subscribe to match changes:
- Status updates
- Score updates
- Winner announcements

### 3. Live Bracket Updates
Real-time bracket updates as matches complete.

## Integration Points

### 1. Lobbies
- Create lobby for each match
- Link match to lobby
- Auto-close lobby after match completion

### 2. Games
- Link tournaments to games
- Use game covers/heroes
- Filter tournaments by game

### 3. Profiles
- Tournament history on profile
- Tournament wins/placements
- Hosted tournaments
- Prize winnings history
- Total prize money earned

### 4. Premium System Integration
- Check user's premium status before tournament creation
- Enforce participant limits based on tier
- Apply platform fees based on tier (10% free, 5% premium)
- Show premium badges on tournament cards
- Limit tournament formats for free users

## Implementation Steps

### Phase 1: Database & API
1. Create database migrations
2. Set up RLS policies
3. Implement API routes
4. Add tournament search/indexing

### Phase 2: Basic UI
1. Tournament listing page
2. Tournament detail page
3. Tournament card component
4. Create tournament modal/page

### Phase 3: Registration & Management
1. Registration system
2. Check-in system
3. Participant management
4. Tournament status management

### Phase 4: Bracket System
1. Bracket generation logic
2. Bracket visualization component
3. Match management
4. Result reporting

### Phase 5: Real-time & Polish
1. Real-time subscriptions
2. Notifications
3. Mobile optimization
4. Testing & bug fixes

## Notifications

### Types:
- Tournament registration open
- Tournament starting soon
- Check-in reminder
- Match scheduled
- Match result
- Tournament completed
- Prize awarded

## Premium Features

- Create paid tournaments (entry fees)
- Larger tournaments (64+ participants)
- Custom prize distributions
- Advanced bracket formats
- Tournament analytics
- Custom branding

## Prize Distribution Examples

### Example 1: 16-Player Single Elimination
- Entry Fee: $10
- Participants: 16
- Prize Pool: $144 (16 × $10 × 0.9, 10% platform fee)
- Distribution:
  - 1st Place: $72 (50%)
  - 2nd Place: $43.20 (30%)
  - 3rd Place: $28.80 (20%)

### Example 2: 32-Player Single Elimination (Premium)
- Entry Fee: $20
- Participants: 32
- Prize Pool: $608 (32 × $20 × 0.95, 5% platform fee)
- Distribution:
  - 1st Place: $243.20 (40%)
  - 2nd Place: $152.00 (25%)
  - 3rd Place: $91.20 (15%)
  - 4th Place: $60.80 (10%)
  - 5th-6th Place: $30.40 each (5% each)

### Example 3: Free Tournament
- Entry Fee: $0
- Participants: 16
- Prize Pool: $0
- No prizes distributed

## Future Enhancements

- Team tournaments
- Recurring tournaments
- Tournament series/seasons
- Leaderboards
- Tournament chat
- Streaming integration
- Automated match scheduling
- Anti-cheat integration
- Tournament replays/highlights
- Prize pool contributions (sponsors)
- Crowdfunded prize pools

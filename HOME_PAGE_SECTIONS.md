# Home Page Sections/Rails

## Current Sections

The home page currently includes:
1. **Hero Section** - Main CTA with matchmaking button and explore link
2. **Trending Games** - Top 5 most searched games in the last 7 days
3. **Upcoming Events** - Next 4 scheduled/ongoing events
4. **Active Lobbies** - Recent 4 open/in-progress lobbies

## Proposed New Sections

### 1. Featured Game of the Week
**Position**: After Hero Section, before Trending Games  
**Purpose**: Highlight a curated game to drive engagement

**Content**:
- Large featured game card with hero image
- Game name and description
- Quick stats (active lobbies, players online)
- "Explore Game" CTA button
- Rotates weekly (manually curated or algorithm-based)

**Data Source**:
- Manually selected or based on highest engagement
- Query: Game with most active lobbies + events in current week

**Component**: `FeaturedGameCard` (already exists, may need enhancement)

**Layout**:
```tsx
<section className="py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl font-title text-white flex items-center gap-2 mb-6">
      <AutoAwesome className="w-6 h-6 text-cyan-400" />
      Game of the Week
    </h2>
    <FeaturedGameCard game={featuredGame} />
  </div>
</section>
```

---

### 2. Popular Games This Month
**Position**: After Trending Games  
**Purpose**: Show games with sustained popularity over a longer period

**Content**:
- Grid of 6-8 game cards
- Games with most lobbies created in last 30 days
- Shows month-over-month growth indicator
- "View All Popular Games" link

**Data Source**:
```sql
SELECT game_id, COUNT(*) as lobby_count
FROM lobbies
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY game_id
ORDER BY lobby_count DESC
LIMIT 8
```

**Component**: `GameCard` (reuse existing)

**Layout**:
```tsx
<section className="py-12 bg-slate-900/30">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-title text-white flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-cyan-400" />
        Popular This Month
      </h2>
      <Link href="/games?sort=popular" className="text-sm text-cyan-400 hover:text-cyan-300">
        View all →
      </Link>
    </div>
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
      {popularGames.map((game) => (
        <GameCard key={game.id} {...game} />
      ))}
    </div>
  </div>
</section>
```

---

### 3. Recommended for You
**Position**: After Upcoming Events (only if user is logged in)  
**Purpose**: Personalized game recommendations based on user's library

**Content**:
- Games similar to user's library
- Games from genres user plays
- Games their followed users are playing
- "Not interested" option to improve recommendations

**Data Source**:
- Analyze user's `user_games` table
- Find games with similar tags/genres
- Check what followed users are playing
- Exclude games already in user's library

**Component**: `RecommendedGameCard` (new component with "Add to Library" quick action)

**Layout**:
```tsx
{user && (
  <section className="py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-title text-white flex items-center gap-2 mb-6">
        <AutoAwesome className="w-6 h-6 text-cyan-400" />
        Recommended for You
      </h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {recommendedGames.map((game) => (
          <RecommendedGameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  </section>
)}
```

---

### 4. People You Might Like
**Position**: After Recommended for You (only if user is logged in)  
**Purpose**: Suggest users to follow based on shared interests and recent encounters

**Content**:
- Mix of users from recent players and users with similar game libraries
- Avatar, username, mutual games count
- "Follow" button
- Link to profile
- Shows why they're suggested (e.g., "3 mutual games", "Recently played together")

**Data Source**:
- Combine two sources:
  1. **Recent Players**: Users from `recent_players` table (last 30 days)
  2. **Similar Games**: Users who share games from `user_games` table
- Exclude users already followed
- Exclude current user
- Prioritize users with more mutual games
- Limit to 6-8 users

**SQL Query**:
```sql
-- Get users with similar games
WITH user_games AS (
  SELECT game_id FROM user_games WHERE user_id = $1
),
similar_users AS (
  SELECT 
    ug.user_id,
    COUNT(DISTINCT ug.game_id) as mutual_games,
    MAX(ug.created_at) as last_game_added
  FROM user_games ug
  INNER JOIN user_games current_user_games ON ug.game_id = current_user_games.game_id
  WHERE current_user_games.user_id = $1
    AND ug.user_id != $1
    AND ug.user_id NOT IN (
      SELECT following_id FROM follows WHERE follower_id = $1
    )
  GROUP BY ug.user_id
  HAVING COUNT(DISTINCT ug.game_id) >= 2
),
recent_encounters AS (
  SELECT 
    encountered_player_id as user_id,
    MAX(last_encountered_at) as last_encountered
  FROM recent_players
  WHERE user_id = $1
    AND last_encountered_at >= NOW() - INTERVAL '30 days'
    AND encountered_player_id NOT IN (
      SELECT following_id FROM follows WHERE follower_id = $1
    )
  GROUP BY encountered_player_id
)
SELECT DISTINCT
  p.id,
  p.username,
  p.avatar_url,
  COALESCE(su.mutual_games, 0) as mutual_games,
  re.last_encountered,
  CASE 
    WHEN re.user_id IS NOT NULL AND su.user_id IS NOT NULL THEN 'both'
    WHEN re.user_id IS NOT NULL THEN 'recent'
    ELSE 'similar'
  END as suggestion_reason
FROM profiles p
LEFT JOIN similar_users su ON su.user_id = p.id
LEFT JOIN recent_encounters re ON re.user_id = p.id
WHERE (su.user_id IS NOT NULL OR re.user_id IS NOT NULL)
ORDER BY 
  CASE WHEN re.user_id IS NOT NULL AND su.user_id IS NOT NULL THEN 1 ELSE 2 END,
  COALESCE(su.mutual_games, 0) DESC,
  re.last_encountered DESC NULLS LAST
LIMIT 8
```

**Component**: `PeopleYouMightLikeCard` (new component)

**Layout**:
```tsx
{user && suggestedPeople.length > 0 && (
  <section className="py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-title text-white flex items-center gap-2">
          <People className="w-6 h-6 text-cyan-400" />
          People You Might Like
        </h2>
        <Link href="/recent-players" className="text-sm text-cyan-400 hover:text-cyan-300">
          View all →
        </Link>
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {suggestedPeople.map((person) => (
          <PeopleYouMightLikeCard key={person.id} person={person} />
        ))}
      </div>
    </div>
  </section>
)}
```

**Component Details** (`PeopleYouMightLikeCard`):
- Avatar image
- Username (link to profile)
- Suggestion reason badge:
  - "X mutual games" (if similar games)
  - "Recently played together" (if recent encounter)
  - "X mutual games • Recently played" (if both)
- Follow/Unfollow button
- Online status indicator (optional)

---

### 5. Recent Activity Feed
**Position**: After Active Lobbies  
**Purpose**: Show recent platform activity to create sense of community

**Content**:
- Recent lobby creations
- New game additions to libraries
- Event participations
- User follows
- Mixed timeline of activities
- Click to view details

**Data Source**:
- Aggregate from multiple tables:
  - `lobbies` (new lobbies)
  - `user_games` (new game additions)
  - `event_participants` (event joins)
  - `follows` (new follows)
- Order by `created_at DESC`
- Limit to 10-15 items

**Component**: `ActivityFeedItem` (new component)

**Layout**:
```tsx
<section className="py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-title text-white flex items-center gap-2">
        <Bolt className="w-6 h-6 text-cyan-400" />
        Recent Activity
      </h2>
      <Link href="/activity" className="text-sm text-cyan-400 hover:text-cyan-300">
        View all →
      </Link>
    </div>
    <div className="space-y-3">
      {recentActivity.map((activity) => (
        <ActivityFeedItem key={activity.id} activity={activity} />
      ))}
    </div>
  </div>
</section>
```

---

### 6. Top Players This Week
**Position**: After Recent Activity (or before footer)  
**Purpose**: Showcase active community members

**Content**:
- Top 6-8 players by activity
- Metrics: lobbies hosted, events joined, games added
- Avatar, username, activity badge
- Link to profile

**Data Source**:
```sql
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  COUNT(DISTINCT l.id) as lobbies_hosted,
  COUNT(DISTINCT ep.event_id) as events_joined,
  COUNT(DISTINCT ug.game_id) as games_added
FROM profiles p
LEFT JOIN lobbies l ON l.host_id = p.id AND l.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN event_participants ep ON ep.user_id = p.id AND ep.created_at >= NOW() - INTERVAL '7 days'
LEFT JOIN user_games ug ON ug.user_id = p.id AND ug.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.username, p.avatar_url
ORDER BY (lobbies_hosted * 3 + events_joined * 2 + games_added) DESC
LIMIT 8
```

**Component**: `TopPlayerCard` (new component)

**Layout**:
```tsx
<section className="py-12 bg-slate-900/30">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl font-title text-white flex items-center gap-2 mb-6">
      <People className="w-6 h-6 text-cyan-400" />
      Top Players This Week
    </h2>
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
      {topPlayers.map((player) => (
        <TopPlayerCard key={player.id} player={player} />
      ))}
    </div>
  </div>
</section>
```

---

### 7. New Releases
**Position**: After Popular Games This Month  
**Purpose**: Highlight newly added games to the platform

**Content**:
- Games recently added to user libraries (first time seen)
- Games with recent lobby activity (newly discovered)
- "New" badge
- Limited to last 7 days

**Data Source**:
```sql
SELECT DISTINCT game_id
FROM user_games
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY game_id
HAVING COUNT(*) >= 3  -- At least 3 users added it
ORDER BY MAX(created_at) DESC
LIMIT 6
```

**Component**: `GameCard` with "New" badge overlay

**Layout**:
```tsx
<section className="py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-title text-white flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-cyan-400" />
        New Releases
      </h2>
      <Link href="/games?sort=newest" className="text-sm text-cyan-400 hover:text-cyan-300">
        View all →
      </Link>
    </div>
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {newReleases.map((game) => (
        <GameCard key={game.id} game={game} isNew />
      ))}
    </div>
  </div>
</section>
```

---

### 8. Community Stats
**Position**: Before footer, full width  
**Purpose**: Show platform growth and engagement metrics

**Content**:
- Total active users
- Total games in platform
- Active lobbies right now
- Events this week
- Total matches made (optional)

**Data Source**:
- Real-time counts from database
- Cache for 5 minutes to reduce load

**Component**: `CommunityStats` (new component)

**Layout**:
```tsx
<section className="py-12 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-2xl font-title text-white text-center mb-8">
      Community Stats
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
      <StatCard label="Active Users" value={stats.activeUsers} icon={<People />} />
      <StatCard label="Games" value={stats.totalGames} icon={<SportsEsports />} />
      <StatCard label="Active Lobbies" value={stats.activeLobbies} icon={<Group />} />
      <StatCard label="Events This Week" value={stats.eventsThisWeek} icon={<EventIcon />} />
      <StatCard label="Matches Made" value={stats.matchesMade} icon={<Handshake />} />
    </div>
  </div>
</section>
```

---

### 9. Most Active Communities
**Position**: After Popular Games This Month  
**Purpose**: Highlight games with active communities

**Content**:
- Games with most Discord/Mumble communities
- Games with most guides
- Games with most active discussions
- Community count badge

**Data Source**:
```sql
SELECT 
  gc.game_id,
  COUNT(DISTINCT gc.id) as community_count,
  COUNT(DISTINCT g.id) as guide_count
FROM game_communities gc
LEFT JOIN game_guides g ON g.game_id = gc.game_id
GROUP BY gc.game_id
ORDER BY (community_count * 2 + guide_count) DESC
LIMIT 6
```

**Component**: `CommunityGameCard` (new component with community badge)

---

### 10. Quick Access Games
**Position**: After Hero Section (if user is logged in)  
**Purpose**: Quick access to user's most played games

**Content**:
- User's top 5 games by lobby activity
- Horizontal scrollable row
- Quick "Create Lobby" button for each
- Shows last played date

**Data Source**:
- User's `user_games` joined with `lobbies` where user is host/member
- Order by most recent lobby activity

**Component**: `QuickAccessGameCard` (new component)

**Layout**:
```tsx
{user && quickAccessGames.length > 0 && (
  <section className="py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl font-title text-white mb-4">Your Games</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {quickAccessGames.map((game) => (
          <QuickAccessGameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  </section>
)}
```

---

## Section Ordering (Recommended)

1. **Hero Section** (existing)
2. **Quick Access Games** (if logged in)
3. **Featured Game of the Week**
4. **Trending Games** (existing)
5. **Popular Games This Month**
6. **Most Active Communities**
7. **New Releases**
8. **Upcoming Events** (existing)
9. **Recommended for You** (if logged in)
10. **People You Might Like** (if logged in)
11. **Active Lobbies** (existing)
12. **Recent Activity Feed**
13. **Top Players This Week**
14. **Community Stats**
15. **Footer**

---

## Implementation Priority

### Phase 1 (High Priority)
- Featured Game of the Week
- Popular Games This Month
- Community Stats
- Quick Access Games (for logged-in users)

### Phase 2 (Medium Priority)
- Recommended for You
- People You Might Like
- Recent Activity Feed
- Top Players This Week
- New Releases

### Phase 3 (Lower Priority)
- Most Active Communities
- Additional personalized sections

---

## Data Fetching Strategy

### Server-Side Rendering
- All sections should fetch data server-side in `page.tsx`
- Use `Promise.all()` for parallel fetching
- Cache game cover images from SteamGridDB

### Caching
- Use Next.js `revalidate` for static data (games, stats)
- Cache user-specific data (recommendations) with shorter TTL
- Use Supabase realtime for live data (active lobbies, stats)

### Performance
- Limit items per section (4-8 items)
- Lazy load images
- Use pagination for "View all" links
- Implement infinite scroll for activity feeds

---

## Component Structure

```
src/components/
├── home/
│   ├── FeaturedGameCard.tsx
│   ├── RecommendedGameCard.tsx
│   ├── PeopleYouMightLikeCard.tsx
│   ├── ActivityFeedItem.tsx
│   ├── TopPlayerCard.tsx
│   ├── CommunityStats.tsx
│   ├── QuickAccessGameCard.tsx
│   └── CommunityGameCard.tsx
```

---

## API Endpoints Needed

### `/api/home/popular-games`
- Returns popular games for the month
- Query params: `period` (7d, 30d, all-time)

### `/api/home/recommended`
- Returns personalized recommendations
- Requires authentication
- Query params: `limit`

### `/api/home/people-you-might-like`
- Returns suggested users to follow
- Requires authentication
- Combines recent players and users with similar games
- Query params: `limit`

### `/api/home/activity`
- Returns recent activity feed
- Query params: `limit`, `offset`

### `/api/home/top-players`
- Returns top players by activity
- Query params: `period` (7d, 30d), `limit`

### `/api/home/stats`
- Returns community statistics
- Cached for 5 minutes

---

## Styling Guidelines

- Maintain consistent spacing: `py-12` for sections
- Use alternating backgrounds: `bg-slate-900/30` or `bg-slate-900/50` for visual separation
- Section headers: `text-2xl font-title text-white` with cyan icon
- "View all" links: `text-sm text-cyan-400 hover:text-cyan-300`
- Grid layouts: Responsive `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` pattern
- Max width container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

---

## Notes

- Sections should gracefully handle empty states
- Show loading skeletons during data fetch
- Implement error boundaries for each section
- Consider A/B testing section order and visibility
- Track user engagement with each section for optimization


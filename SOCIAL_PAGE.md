# Social / Activity Feed Page

## Overview

A centralized social activity feed page (`/social`) that displays real-time updates about user activities across the platform. This page shows what users are doing, creating, and engaging with, creating a sense of community and helping users discover new games, lobbies, and events.

## Core Features

### 1. Activity Feed Items
The page displays various types of activities:

- **Lobby Creation**: "User created a lobby for [Game Name]"
- **Game Addition**: "User added [Game Name] to their library"
- **Event Creation**: "User created event [Event Name] for [Game Name]"
- **Event Participation**: "User joined event [Event Name]"
- **Lobby Join**: "User joined [Game Name] lobby"
- **Follow Activity**: "User started following [Username]"
- **Profile Update**: "User updated their profile" (optional)

### 2. Activity Timeline
- Chronological feed of activities (newest first)
- Real-time updates via Supabase Realtime
- Infinite scroll or pagination
- Filter by activity type
- Filter by followed users only

### 3. Recent Players Integration (Optional)
- Merge recent players section into the social page
- Show "Recently played with" activities
- Quick access to recent player profiles

## Database Schema

### Table: `user_activities` (New)

```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB NOT NULL, -- Flexible data storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_user_type ON user_activities(user_id, activity_type);
```

### Activity Types

```typescript
type ActivityType = 
  | 'lobby_created'
  | 'lobby_joined'
  | 'game_added'
  | 'event_created'
  | 'event_joined'
  | 'user_followed'
  | 'profile_updated'
  | 'recent_encounter'
```

### Activity Data Structure

```typescript
interface ActivityData {
  // For lobby_created
  lobby_id?: string
  game_id?: number
  game_name?: string
  
  // For game_added
  game_id?: number
  game_name?: string
  
  // For event_created
  event_id?: string
  event_name?: string
  game_id?: number
  game_name?: string
  
  // For event_joined
  event_id?: string
  event_name?: string
  
  // For user_followed
  followed_user_id?: string
  followed_username?: string
  
  // For recent_encounter
  encountered_user_id?: string
  encountered_username?: string
  lobby_id?: string
}
```

## Alternative: Query Existing Tables

Instead of creating a new table, we can query existing tables and aggregate activities:

### Activities from Existing Tables

1. **Lobby Creation** - From `lobbies` table
2. **Game Addition** - From `user_games` table
3. **Event Creation** - From `events` table
4. **Event Participation** - From `event_participants` table
5. **Lobby Join** - From `lobby_members` table
6. **Follow Activity** - From `follows` table
7. **Recent Encounters** - From `recent_players` table

### Aggregated Query Approach

```sql
-- Get all activities in a single query using UNION
WITH activities AS (
  -- Lobby creations
  SELECT 
    host_id as user_id,
    'lobby_created' as activity_type,
    jsonb_build_object(
      'lobby_id', id,
      'game_id', game_id,
      'game_name', game_name
    ) as activity_data,
    created_at
  FROM lobbies
  WHERE created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Game additions
  SELECT 
    user_id,
    'game_added' as activity_type,
    jsonb_build_object(
      'game_id', game_id,
      'game_name', game_name
    ) as activity_data,
    created_at
  FROM user_games
  WHERE created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Event creations
  SELECT 
    created_by as user_id,
    'event_created' as activity_type,
    jsonb_build_object(
      'event_id', id,
      'event_name', title,
      'game_id', game_id,
      'game_name', game_name
    ) as activity_data,
    created_at
  FROM events
  WHERE created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Event participations
  SELECT 
    ep.user_id,
    'event_joined' as activity_type,
    jsonb_build_object(
      'event_id', e.id,
      'event_name', e.title,
      'game_id', e.game_id,
      'game_name', e.game_name
    ) as activity_data,
    ep.created_at
  FROM event_participants ep
  JOIN events e ON e.id = ep.event_id
  WHERE ep.created_at >= NOW() - INTERVAL '7 days'
    AND ep.status = 'in'
  
  UNION ALL
  
  -- Lobby joins
  SELECT 
    lm.user_id,
    'lobby_joined' as activity_type,
    jsonb_build_object(
      'lobby_id', l.id,
      'game_id', l.game_id,
      'game_name', l.game_name
    ) as activity_data,
    lm.created_at
  FROM lobby_members lm
  JOIN lobbies l ON l.id = lm.lobby_id
  WHERE lm.created_at >= NOW() - INTERVAL '7 days'
    AND l.status IN ('open', 'in_progress')
  
  UNION ALL
  
  -- Follows
  SELECT 
    follower_id as user_id,
    'user_followed' as activity_type,
    jsonb_build_object(
      'followed_user_id', following_id,
      'followed_username', p.username
    ) as activity_data,
    f.created_at
  FROM follows f
  JOIN profiles p ON p.id = f.following_id
  WHERE f.created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Recent encounters
  SELECT 
    rp.user_id,
    'recent_encounter' as activity_type,
    jsonb_build_object(
      'encountered_user_id', rp.encountered_player_id,
      'encountered_username', p.username,
      'lobby_id', rp.lobby_id
    ) as activity_data,
    rp.last_encountered_at as created_at
  FROM recent_players rp
  JOIN profiles p ON p.id = rp.encountered_player_id
  WHERE rp.last_encountered_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  a.*,
  p.username,
  p.avatar_url
FROM activities a
JOIN profiles p ON p.id = a.user_id
ORDER BY a.created_at DESC
LIMIT 50;
```

## Page Structure

### Route: `/social`

**File**: `src/app/social/page.tsx`

### Layout

```
┌─────────────────────────────────────┐
│  Social / Activity Feed             │
│  [Filter: All | Followed | Type]    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Avatar] User created lobby  │   │
│  │         for Game Name        │   │
│  │         2 hours ago          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Avatar] User added Game     │   │
│  │         to their library     │   │
│  │         3 hours ago           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Avatar] User created event  │   │
│  │         Event Name           │   │
│  │         5 hours ago           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Load More / Infinite Scroll]     │
│                                     │
└─────────────────────────────────────┘
```

## Components

### 1. `ActivityFeedItem` Component

**File**: `src/components/ActivityFeedItem.tsx`

**Props**:
```typescript
interface ActivityFeedItemProps {
  activity: {
    id: string
    user_id: string
    username: string
    avatar_url: string | null
    activity_type: ActivityType
    activity_data: ActivityData
    created_at: string
  }
}
```

**Features**:
- User avatar and username (link to profile)
- Activity icon based on type
- Activity description text
- Game/event/lobby links
- Relative time (e.g., "2 hours ago")
- Hover effects

### 2. `ActivityFeedFilters` Component

**File**: `src/components/ActivityFeedFilters.tsx`

**Filters**:
- **All Activities** (default)
- **Followed Users Only**
- **Activity Type**:
  - Lobby Activities
  - Game Activities
  - Event Activities
  - Social Activities

### 3. `RecentPlayersSection` Component (Optional)

**File**: `src/components/RecentPlayersSection.tsx`

If merging recent players:
- Horizontal scrollable list
- Recent player cards
- "View all" link to `/recent-players`

## API Endpoints

### `GET /api/social/activities`

**Query Parameters**:
- `limit` (default: 20)
- `offset` (default: 0)
- `filter` - 'all' | 'followed' | activity type
- `user_id` - Filter by specific user (optional)

**Response**:
```json
{
  "activities": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "username": "string",
      "avatar_url": "string | null",
      "activity_type": "lobby_created",
      "activity_data": {
        "lobby_id": "uuid",
        "game_id": 123,
        "game_name": "Game Name"
      },
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "hasMore": boolean,
  "total": number
}
```

## Implementation Details

### Server-Side Data Fetching

```typescript
async function getActivities(
  userId: string | null,
  filter: 'all' | 'followed' | string = 'all',
  limit: number = 20,
  offset: number = 0
) {
  const supabase = await createServerSupabaseClient()
  
  // Build base query
  let query = supabase
    .from('user_activities') // or use UNION query approach
    .select(`
      *,
      user:profiles!user_activities_user_id_fkey(username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  // Apply filters
  if (filter === 'followed' && userId) {
    // Get followed user IDs
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
    
    const followedIds = follows?.map(f => f.following_id) || []
    if (followedIds.length > 0) {
      query = query.in('user_id', followedIds)
    } else {
      // No followed users, return empty
      return { activities: [], hasMore: false, total: 0 }
    }
  } else if (filter !== 'all') {
    query = query.eq('activity_type', filter)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching activities:', error)
    return { activities: [], hasMore: false, total: 0 }
  }
  
  return {
    activities: data || [],
    hasMore: (data?.length || 0) === limit,
    total: data?.length || 0
  }
}
```

### Real-time Updates

```typescript
useEffect(() => {
  if (!user) return

  const channel = supabase
    .channel('social_activities')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activities',
      },
      (payload) => {
        // Add new activity to feed
        setActivities((prev) => [payload.new, ...prev])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user, supabase])
```

## Activity Item Rendering

### Lobby Created
```
┌─────────────────────────────────────┐
│ [Avatar] @username created a lobby  │
│         for Counter-Strike 2        │
│         [View Lobby] [Game Page]    │
│         2 hours ago                  │
└─────────────────────────────────────┘
```

### Game Added
```
┌─────────────────────────────────────┐
│ [Avatar] @username added             │
│         Counter-Strike 2            │
│         to their library             │
│         [View Game]                  │
│         3 hours ago                  │
└─────────────────────────────────────┘
```

### Event Created
```
┌─────────────────────────────────────┐
│ [Avatar] @username created event     │
│         Weekly CS2 Tournament       │
│         [View Event] [Game Page]     │
│         5 hours ago                  │
└─────────────────────────────────────┘
```

### Event Joined
```
┌─────────────────────────────────────┐
│ [Avatar] @username joined event      │
│         Weekly CS2 Tournament       │
│         [View Event]                 │
│         1 hour ago                   │
└─────────────────────────────────────┘
```

### User Followed
```
┌─────────────────────────────────────┐
│ [Avatar] @username started following │
│         @otheruser                  │
│         [View Profile]               │
│         4 hours ago                  │
└─────────────────────────────────────┘
```

### Recent Encounter
```
┌─────────────────────────────────────┐
│ [Avatar] @username recently played  │
│         with @otheruser              │
│         [View Profile] [View Lobby]  │
│         6 hours ago                   │
└─────────────────────────────────────┘
```

## Styling

### Activity Card
- Background: `bg-slate-800/50 border border-slate-700/50`
- Hover: `hover:border-cyan-500/50`
- Padding: `p-4`
- Rounded corners: `rounded-lg`
- Avatar size: `w-10 h-10`
- Text colors: White for username, slate-400 for activity text

### Layout
- Max width: `max-w-3xl` (centered feed)
- Gap between items: `gap-4`
- Section padding: `py-12`

## Filtering Options

### Filter Bar Component
```tsx
<div className="flex items-center gap-4 mb-6">
  <button className={filter === 'all' ? 'active' : ''}>
    All
  </button>
  <button className={filter === 'followed' ? 'active' : ''}>
    Following
  </button>
  <select>
    <option>All Types</option>
    <option>Lobbies</option>
    <option>Games</option>
    <option>Events</option>
    <option>Social</option>
  </select>
</div>
```

## Pagination / Infinite Scroll

### Option 1: Infinite Scroll
- Use `react-intersection-observer` or similar
- Load more activities when user scrolls to bottom
- Show loading spinner while fetching

### Option 2: Pagination
- Traditional page numbers or "Load More" button
- Show page numbers for navigation

## Recent Players Integration

If merging recent players into the social page:

### Layout Option 1: Sidebar
```
┌──────────────┬──────────────────────┐
│              │  Activity Feed       │
│  Recent      │                      │
│  Players     │  [Activities...]     │
│              │                      │
│  [List]      │                      │
└──────────────┴──────────────────────┘
```

### Layout Option 2: Top Section
```
┌─────────────────────────────────────┐
│  Recent Players                     │
│  [Horizontal Scroll]                │
├─────────────────────────────────────┤
│  Activity Feed                      │
│  [Activities...]                    │
└─────────────────────────────────────┘
```

### Layout Option 3: Mixed Feed
- Recent encounters appear in the activity feed
- Marked with special styling or badge
- Can filter to show only encounters

## Performance Considerations

### Caching
- Cache activities for 1-2 minutes
- Use `localStorage` for client-side caching
- Implement `hasFetchedRef` pattern to prevent refetches on tab switches

### Query Optimization
- Limit initial load to 20-30 items
- Use database indexes on `created_at` and `user_id`
- Consider materialized view for aggregated activities
- Batch game cover image fetching

### Real-time Updates
- Only subscribe to new activities (not updates/deletes for feed)
- Debounce rapid activity insertions
- Limit real-time updates to last 24 hours

## Database Indexes

```sql
-- If using user_activities table
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_user_created ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_user_activities_type_created ON user_activities(activity_type, created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_user_activities_user_type_created ON user_activities(user_id, activity_type, created_at DESC);
```

## Row Level Security (RLS)

```sql
-- Anyone can view activities
CREATE POLICY "Anyone can view activities"
  ON user_activities FOR SELECT
  USING (true);

-- Users can create their own activities
CREATE POLICY "Users can create own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Activity Generation

### Option 1: Database Triggers
Create triggers on existing tables to automatically create activity records:

```sql
-- Trigger for lobby creation
CREATE OR REPLACE FUNCTION log_lobby_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activities (user_id, activity_type, activity_data)
  VALUES (
    NEW.host_id,
    'lobby_created',
    jsonb_build_object(
      'lobby_id', NEW.id,
      'game_id', NEW.game_id,
      'game_name', NEW.game_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lobby_created_activity
  AFTER INSERT ON lobbies
  FOR EACH ROW
  EXECUTE FUNCTION log_lobby_activity();
```

### Option 2: Application-Level
Create activities in application code when actions occur:
- After lobby creation
- After game addition
- After event creation
- etc.

## Future Enhancements

1. **Activity Reactions**: Like/comment on activities
2. **Activity Sharing**: Share interesting activities
3. **Activity Notifications**: Notify users when followed users have activities
4. **Activity Analytics**: Track most active users, popular games, etc.
5. **Activity Search**: Search activities by game, user, or type
6. **Activity Groups**: Group similar activities (e.g., "5 users added this game")
7. **Trending Activities**: Highlight activities getting attention
8. **Activity Feed Export**: Export activity history
9. **Privacy Controls**: Allow users to hide certain activity types
10. **Activity Highlights**: Show weekly/monthly highlights

## Migration Strategy

### Phase 1: Query-Based Approach
- Start with querying existing tables (no new table needed)
- Implement basic activity feed
- Test performance and user engagement

### Phase 2: Activity Table (If Needed)
- If query approach is too slow, create `user_activities` table
- Add triggers or application-level logging
- Migrate to new system gradually

### Phase 3: Recent Players Integration
- Merge recent players section into social page
- Unified activity and encounter feed
- Enhanced filtering and discovery

## Notes

- Consider privacy: Some users may not want all activities public
- Performance: Large user base = many activities, need efficient queries
- Real-time: Balance between real-time updates and performance
- Caching: Important for fast page loads
- Pagination: Essential for large activity feeds


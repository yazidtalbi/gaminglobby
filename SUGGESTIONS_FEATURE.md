# Suggestions/Community/Recommendations Feature

## Overview

A forum-like feature where users can request game recommendations and receive community-sourced suggestions. Similar to Reddit's recommendation threads, users can post requests, receive game suggestions, upvote suggestions, and discuss each game in dedicated threads.

## Core Features

### 1. Request Posts
- Users create posts asking for game recommendations
- Posts include:
  - Title
  - Description/body text
  - Games the user likes (positive preferences)
  - Games the user dislikes/bans (negative preferences - these cannot be suggested)
  - Tags/categories (optional)
  - Created timestamp
  - Author information

### 2. Game Suggestions
- Users can suggest games in response to requests
- Each suggestion includes:
  - Game ID (from SteamGridDB)
  - Game name
  - Optional comment/explanation
  - Upvote count
  - Created timestamp
  - Author information
  - Link to discussion thread

### 3. Upvoting System
- Users can upvote game suggestions
- Each user can upvote a suggestion once
- Upvote count is displayed and sorted by
- Real-time upvote updates

### 4. Discussion Threads
- Each game suggestion has its own discussion thread
- Threads are not real-time (like Reddit comments)
- Features:
  - Nested comments (replies to comments)
  - Upvote/downvote comments
  - Edit/delete own comments
  - Sort by: newest, top, controversial

### 5. Game Filtering
- Banned games cannot be suggested in a request
- System validates suggestions against banned games list
- Users can see which games are banned in a request

## Database Schema

### Table: `recommendation_requests`

```sql
CREATE TABLE recommendation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE INDEX idx_recommendation_requests_user_id ON recommendation_requests(user_id);
CREATE INDEX idx_recommendation_requests_created_at ON recommendation_requests(created_at DESC);
CREATE INDEX idx_recommendation_requests_status ON recommendation_requests(status);
```

### Table: `request_game_preferences`

```sql
CREATE TABLE request_game_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES recommendation_requests(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL, -- SteamGridDB game ID
  preference_type VARCHAR(10) NOT NULL CHECK (preference_type IN ('liked', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_request FOREIGN KEY (request_id) REFERENCES recommendation_requests(id),
  UNIQUE(request_id, game_id, preference_type)
);

CREATE INDEX idx_request_game_preferences_request_id ON request_game_preferences(request_id);
CREATE INDEX idx_request_game_preferences_game_id ON request_game_preferences(game_id);
```

### Table: `game_suggestions`

```sql
CREATE TABLE game_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES recommendation_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL, -- SteamGridDB game ID
  game_name VARCHAR(255) NOT NULL,
  comment TEXT,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_request FOREIGN KEY (request_id) REFERENCES recommendation_requests(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id),
  UNIQUE(request_id, user_id, game_id) -- One suggestion per user per game per request
);

CREATE INDEX idx_game_suggestions_request_id ON game_suggestions(request_id);
CREATE INDEX idx_game_suggestions_user_id ON game_suggestions(user_id);
CREATE INDEX idx_game_suggestions_upvote_count ON game_suggestions(upvote_count DESC);
CREATE INDEX idx_game_suggestions_created_at ON game_suggestions(created_at DESC);
```

### Table: `suggestion_upvotes`

```sql
CREATE TABLE suggestion_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES game_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_suggestion FOREIGN KEY (suggestion_id) REFERENCES game_suggestions(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id),
  UNIQUE(suggestion_id, user_id) -- One upvote per user per suggestion
);

CREATE INDEX idx_suggestion_upvotes_suggestion_id ON suggestion_upvotes(suggestion_id);
CREATE INDEX idx_suggestion_upvotes_user_id ON suggestion_upvotes(user_id);
```

### Table: `suggestion_threads`

```sql
CREATE TABLE suggestion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES game_suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_suggestion FOREIGN KEY (suggestion_id) REFERENCES game_suggestions(id),
  UNIQUE(suggestion_id) -- One thread per suggestion
);

CREATE INDEX idx_suggestion_threads_suggestion_id ON suggestion_threads(suggestion_id);
```

### Table: `thread_comments`

```sql
CREATE TABLE thread_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES suggestion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES thread_comments(id) ON DELETE CASCADE, -- For nested replies
  body TEXT NOT NULL,
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  CONSTRAINT fk_thread FOREIGN KEY (thread_id) REFERENCES suggestion_threads(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id),
  CONSTRAINT fk_parent FOREIGN KEY (parent_comment_id) REFERENCES thread_comments(id)
);

CREATE INDEX idx_thread_comments_thread_id ON thread_comments(thread_id);
CREATE INDEX idx_thread_comments_user_id ON thread_comments(user_id);
CREATE INDEX idx_thread_comments_parent_comment_id ON thread_comments(parent_comment_id);
CREATE INDEX idx_thread_comments_created_at ON thread_comments(created_at DESC);
```

### Table: `comment_votes`

```sql
CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES thread_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_comment FOREIGN KEY (comment_id) REFERENCES thread_comments(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id),
  UNIQUE(comment_id, user_id) -- One vote per user per comment
);

CREATE INDEX idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user_id ON comment_votes(user_id);
```

## Row Level Security (RLS) Policies

### `recommendation_requests`
```sql
-- Anyone can read open requests
CREATE POLICY "Anyone can view open requests"
  ON recommendation_requests FOR SELECT
  USING (status = 'open' OR auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create requests"
  ON recommendation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
  ON recommendation_requests FOR UPDATE
  USING (auth.uid() = user_id);
```

### `game_suggestions`
```sql
-- Anyone can view suggestions
CREATE POLICY "Anyone can view suggestions"
  ON game_suggestions FOR SELECT
  USING (true);

-- Authenticated users can create suggestions
CREATE POLICY "Users can create suggestions"
  ON game_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions"
  ON game_suggestions FOR UPDATE
  USING (auth.uid() = user_id);
```

### `suggestion_upvotes`
```sql
-- Anyone can view upvotes
CREATE POLICY "Anyone can view upvotes"
  ON suggestion_upvotes FOR SELECT
  USING (true);

-- Authenticated users can upvote
CREATE POLICY "Users can upvote suggestions"
  ON suggestion_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their upvotes
CREATE POLICY "Users can remove own upvotes"
  ON suggestion_upvotes FOR DELETE
  USING (auth.uid() = user_id);
```

### `thread_comments`
```sql
-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view comments"
  ON thread_comments FOR SELECT
  USING (deleted_at IS NULL);

-- Authenticated users can create comments
CREATE POLICY "Users can create comments"
  ON thread_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON thread_comments FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can soft-delete their own comments
CREATE POLICY "Users can delete own comments"
  ON thread_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (deleted_at IS NOT NULL);
```

## API Endpoints

### Requests

#### `GET /api/recommendations/requests`
Get all open requests (paginated)
- Query params: `page`, `limit`, `sort` (newest, popular)
- Returns: Array of requests with author info

#### `GET /api/recommendations/requests/[id]`
Get a single request with all suggestions
- Returns: Request details, preferences, suggestions

#### `POST /api/recommendations/requests`
Create a new request
- Body: `title`, `body`, `likedGames[]`, `bannedGames[]`
- Returns: Created request

#### `PUT /api/recommendations/requests/[id]`
Update a request (author only)
- Body: `title`, `body`, `status`
- Returns: Updated request

### Suggestions

#### `POST /api/recommendations/requests/[id]/suggestions`
Suggest a game for a request
- Body: `gameId`, `gameName`, `comment`
- Validation: Check if game is banned
- Returns: Created suggestion

#### `POST /api/recommendations/suggestions/[id]/upvote`
Upvote a suggestion
- Returns: Updated upvote count

#### `DELETE /api/recommendations/suggestions/[id]/upvote`
Remove upvote
- Returns: Updated upvote count

### Threads

#### `GET /api/recommendations/suggestions/[id]/thread`
Get thread for a suggestion
- Query params: `sort` (newest, top, controversial)
- Returns: Thread with nested comments

#### `POST /api/recommendations/threads/[id]/comments`
Add a comment to a thread
- Body: `body`, `parentCommentId` (optional for replies)
- Returns: Created comment

#### `PUT /api/recommendations/comments/[id]`
Update a comment (author only)
- Body: `body`
- Returns: Updated comment

#### `DELETE /api/recommendations/comments/[id]`
Soft-delete a comment (author only)
- Returns: Success status

#### `POST /api/recommendations/comments/[id]/vote`
Vote on a comment
- Body: `voteType` (upvote, downvote)
- Returns: Updated vote counts

## UI Components

### 1. Request List Page (`/recommendations`)
- List of all open requests
- Filter by: newest, popular, resolved
- Search functionality
- Create new request button

### 2. Request Detail Page (`/recommendations/[id]`)
- Request header (title, author, date)
- Request body
- Liked games section
- Banned games section
- Suggestions list (sorted by upvotes)
- Add suggestion form
- Discussion threads for each suggestion

### 3. Create Request Form
- Title input
- Body textarea
- Game search for liked games (multi-select)
- Game search for banned games (multi-select)
- Submit button

### 4. Suggestion Card
- Game cover image
- Game name
- Author info
- Comment/explanation
- Upvote button and count
- Link to discussion thread

### 5. Discussion Thread
- Nested comment tree
- Comment form
- Sort options (newest, top, controversial)
- Upvote/downvote buttons
- Reply functionality
- Edit/delete own comments

## User Flows

### Creating a Request
1. User navigates to `/recommendations`
2. Clicks "Create Request" button
3. Fills in title and description
4. Searches and selects games they like
5. Searches and selects games they want to ban
6. Submits request
7. Redirected to request detail page

### Suggesting a Game
1. User views a request
2. Clicks "Suggest a Game" button
3. Searches for a game (validates against banned games)
4. Optionally adds a comment explaining the suggestion
5. Submits suggestion
6. Suggestion appears in the list

### Upvoting a Suggestion
1. User views suggestions on a request
2. Clicks upvote button on a suggestion
3. Upvote count updates in real-time
4. User can remove upvote by clicking again

### Discussing a Game
1. User clicks on a suggestion or "View Discussion" link
2. Thread page opens showing all comments
3. User can sort comments (newest, top, controversial)
4. User can reply to comments (nested structure)
5. User can upvote/downvote comments
6. User can edit/delete their own comments

## Implementation Notes

### Validation Logic
- When suggesting a game, check if it's in the banned games list
- Prevent duplicate suggestions (same user, same game, same request)
- Prevent suggesting games that are already suggested (show existing suggestion instead)

### Real-time Updates
- Use Supabase Realtime for:
  - Upvote count changes
  - New suggestions
  - New comments
  - Comment vote changes

### Caching
- Cache game details from SteamGridDB
- Cache request lists with pagination
- Cache thread comments with proper invalidation

### Performance Considerations
- Paginate requests list
- Paginate comments in threads
- Use database indexes for sorting
- Optimize nested comment queries
- Lazy load game cover images

## Future Enhancements

1. **Request Categories/Tags**: Allow users to tag requests (e.g., "RPG", "Multiplayer", "Indie")
2. **Request Status**: Allow request authors to mark requests as "resolved" when they find a game
3. **Suggestion Reasons**: Pre-defined reasons for suggestions (e.g., "Similar gameplay", "Same developer")
4. **Notifications**: Notify users when their requests receive suggestions or comments
5. **User Reputation**: Track helpful suggestions and comments
6. **Request Following**: Follow requests to get notified of new suggestions
7. **Suggestion Filtering**: Filter suggestions by platform, genre, etc.
8. **Request Templates**: Pre-defined templates for common request types
9. **Moderation**: Report inappropriate requests, suggestions, or comments
10. **Analytics**: Track popular requests, most suggested games, etc.

## Migration File

Create a new migration file: `supabase/migrations/008_add_recommendations.sql`

This migration should include:
- All table creation statements
- RLS policies
- Indexes
- Triggers for updating `updated_at` timestamps
- Triggers for updating upvote counts
- Functions for validating banned games


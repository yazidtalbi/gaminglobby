# Chat System Documentation

## Overview

The chat system in Apoxer provides real-time messaging for lobby members using Supabase Realtime. It enables instant communication between players in game lobbies, with automatic system messages for lobby events and a floating chat widget for easy access across the app.

## Architecture

### Technology Stack

- **Backend**: Supabase (PostgreSQL + Realtime)
- **Frontend**: Next.js 14 (React)
- **Real-time**: Supabase Realtime subscriptions via PostgreSQL Change Data Capture (CDC)
- **State Management**: React hooks (useState, useEffect)

### Database Schema

The chat system uses the `lobby_messages` table:

```sql
CREATE TABLE lobby_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- Messages are automatically deleted when a lobby is deleted (CASCADE)
- Indexed on `lobby_id` and `created_at` for efficient queries
- Row Level Security (RLS) ensures only lobby members can read/write messages

### Security (RLS Policies)

```sql
-- Members can view messages in lobbies they belong to
CREATE POLICY "Lobby messages are viewable by members" ON lobby_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lobby_members 
    WHERE lobby_members.lobby_id = lobby_messages.lobby_id 
    AND lobby_members.user_id = auth.uid()
  )
);

-- Members can send messages only to lobbies they belong to
CREATE POLICY "Members can send messages" ON lobby_messages 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM lobby_members 
    WHERE lobby_members.lobby_id = lobby_messages.lobby_id 
    AND lobby_members.user_id = auth.uid()
  )
);
```

## Components

### 1. LobbyChat Component

**Location**: `src/components/LobbyChat.tsx`

**Purpose**: Main chat interface displayed on lobby pages and in the floating chat widget.

**Features:**
- Fetches initial messages (last 100 messages)
- Real-time subscription to new messages
- Auto-scrolls to bottom on new messages
- Message bubbles with user avatars
- System message handling
- Send message functionality

**Key Implementation Details:**

```typescript
// Initial message fetch
const { data } = await supabase
  .from('lobby_messages')
  .select(`
    *,
    profile:profiles!lobby_messages_user_id_fkey(username, avatar_url)
  `)
  .eq('lobby_id', lobbyId)
  .order('created_at', { ascending: true })
  .limit(100)

// Real-time subscription
const channel = supabase
  .channel(`lobby-messages-${lobbyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'lobby_messages',
    filter: `lobby_id=eq.${lobbyId}`,
  }, async (payload) => {
    // Fetch profile and add message to state
  })
  .subscribe()
```

**Message Sending:**

```typescript
await supabase.from('lobby_messages').insert({
  lobby_id: lobbyId,
  user_id: currentUserId,
  content: newMessage.trim(),
})
```

### 2. FloatingLobbyChat Component

**Location**: `src/components/FloatingLobbyChat.tsx`

**Purpose**: Floating chat widget that appears on all pages (except lobby pages and settings) when a user has an active lobby.

**Features:**
- Compact view (collapsed) showing lobby info
- Expanded view with full chat interface
- Real-time notifications for new messages/members
- Elapsed time display
- Auto-hides when lobby is closed
- Respects user preferences (can be hidden in settings)

**Behavior:**
- Only shows for users with active lobbies (hosting or member)
- Hidden on lobby detail pages (uses full-page chat instead)
- Hidden on settings page
- Can be minimized/expanded
- Shows notification indicator for new activity

**Real-time Subscriptions:**
1. **Lobby Status**: Monitors when lobbies are closed
2. **Lobby Membership**: Detects when user joins/leaves lobbies
3. **New Messages**: Shows notification for new messages (excluding system messages)
4. **New Members**: Shows notification when new members join

### 3. Message Types

#### Regular Messages
- User-generated messages
- Displayed with user avatar, username, and timestamp
- Styled differently for own messages vs. others
- Own messages: Green background, right-aligned
- Others' messages: Slate background, left-aligned

#### System Messages
- Automatically generated for lobby events
- Prefixed with `[SYSTEM]` in content
- Displayed centered without avatar
- Examples:
  - `[SYSTEM] username joined the lobby`
  - `[SYSTEM] username left the lobby`
  - `[SYSTEM] username was kicked by host`
  - `[SYSTEM] username was banned by host`

**System Message Generation:**
- **Join**: Created when user joins a lobby
- **Leave**: Created when user leaves a lobby
- **Kick**: Created when host kicks a member
- **Ban**: Created when host bans a member

## Real-time Communication Flow

### 1. Message Sending Flow

```
User types message → Submit
  ↓
Insert into lobby_messages table
  ↓
Supabase Realtime detects INSERT
  ↓
Broadcasts to all subscribers
  ↓
All connected clients receive update
  ↓
Messages appear in chat UI
```

### 2. Subscription Setup

Each chat instance creates a unique channel:

```typescript
const channel = supabase
  .channel(`lobby-messages-${lobbyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'lobby_messages',
    filter: `lobby_id=eq.${lobbyId}`,
  }, (payload) => {
    // Handle new message
  })
  .subscribe()
```

**Channel Cleanup:**
- Channels are properly unsubscribed when components unmount
- Prevents memory leaks and unnecessary subscriptions

### 3. Duplicate Prevention

The system includes duplicate message prevention:

```typescript
setMessages((prev) => {
  const exists = prev.some((msg) => msg.id === newMsg.id)
  if (exists) return prev
  return [...prev, newMsg]
})
```

## User Experience Features

### Auto-scroll
- Automatically scrolls to bottom when new messages arrive
- Uses `scrollIntoView({ behavior: 'smooth' })`

### Message History
- Loads last 100 messages on initial render
- Ordered by `created_at` ascending (oldest first)
- Messages persist in database until lobby deletion

### Loading States
- Shows spinner while fetching initial messages
- Shows spinner while sending message
- Disables input during send operation

### Empty State
- Displays "No messages yet. Start the conversation!" when no messages exist

### Disabled State
- Chat can be disabled (e.g., when lobby is closed)
- Shows "Chat disabled" placeholder in input field

## Integration Points

### Lobby Page Integration

**Location**: `src/app/lobbies/[lobbyId]/page.tsx`

- Full-page chat interface using `LobbyChat` component
- Chat is always visible and expanded
- System messages generated for join/leave events

### Floating Widget Integration

**Location**: `src/components/FloatingLobbyChat.tsx`

- Embedded `LobbyChat` component in expanded view
- Compact view shows lobby summary
- Appears on all pages except lobby pages and settings

### Quick Matchmaking Bar

**Location**: `src/components/QuickMatchmakingBar.tsx`

- Subscribes to message events for notification indicator
- Shows orange dot when new messages arrive (excluding system messages)

## Performance Considerations

### Message Limit
- Only loads last 100 messages to prevent performance issues
- Older messages are not loaded (can be extended if needed)

### Subscription Management
- Each chat instance creates one subscription
- Proper cleanup prevents subscription leaks
- Channels are uniquely named per lobby

### Profile Fetching
- User profiles (username, avatar) are fetched via foreign key relationship
- Cached in component state to avoid repeated queries

## Error Handling

### Message Send Failures
- Errors are logged to console
- User can retry sending
- No error message displayed to user (silent failure)

### Subscription Failures
- Supabase handles reconnection automatically
- Component continues to work with initial message fetch
- Real-time updates resume when connection restored

## Future Enhancements (Potential)

1. **Message Pagination**: Load older messages on scroll up
2. **Typing Indicators**: Show when users are typing
3. **Message Reactions**: Add emoji reactions to messages
4. **File Attachments**: Support image/file sharing
5. **Message Editing**: Allow users to edit their messages
6. **Message Deletion**: Allow users to delete their messages
7. **Read Receipts**: Show when messages are read
8. **Mentions**: @mention users in messages

## Configuration

### Supabase Realtime Setup

The `lobby_messages` table must have Realtime enabled:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_messages;
```

This enables PostgreSQL Change Data Capture (CDC) for real-time updates.

### Environment Variables

No special environment variables required beyond standard Supabase setup:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing

To test the chat system:

1. Create or join a lobby
2. Open the lobby page or expand the floating chat widget
3. Send a message
4. Verify it appears instantly for all members
5. Test system messages by joining/leaving the lobby
6. Verify notifications appear in floating widget when collapsed

## Troubleshooting

### Messages not appearing in real-time
- Check Supabase Realtime is enabled for `lobby_messages` table
- Verify RLS policies allow user to read messages
- Check browser console for subscription errors

### Duplicate messages
- The system includes duplicate prevention, but if issues occur:
  - Check message IDs are unique
  - Verify subscription cleanup is working

### Performance issues with many messages
- Consider implementing pagination
- Reduce message limit if needed
- Add message archiving for old lobbies

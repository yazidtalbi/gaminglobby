# Supabase Realtime Setup for Ready State Updates

## Issue
The ready state toggle is not updating in real-time for other users. The UPDATE event is not being received.

## Solution

### Step 1: Enable Realtime for lobby_members table

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the `lobby_members` table
4. Enable replication for the `lobby_members` table
5. Make sure **UPDATE** events are enabled (not just INSERT/DELETE)

### Step 2: Verify Realtime is enabled

The `lobby_members` table needs to have Realtime enabled. You can verify this by:

1. Going to **Database** → **Tables** → `lobby_members`
2. Check if there's a Realtime indicator
3. Or run this SQL in the SQL Editor:

```sql
-- Check if realtime is enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'lobby_members'
    ) THEN 'Enabled'
    ELSE 'Disabled'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'lobby_members';
```

### Step 3: Enable Realtime via SQL (if needed)

If Realtime is not enabled, run this SQL:

```sql
-- Enable Realtime for lobby_members table
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_members;
```

### Step 4: Test the subscription

After enabling Realtime:
1. Open the lobby page in two different browser windows (or two different users)
2. Click ready in one window
3. Check the console logs - you should see:
   - `[LobbyPage] UPDATE event received for lobby_members:`
   - The ready state should update in both windows

## Debugging

If UPDATE events still don't work:

1. Check browser console for subscription status
2. Verify the subscription shows `SUBSCRIBED` status
3. Check if INSERT/DELETE events work (they should if Realtime is enabled)
4. Verify the `ready` column exists and is being updated in the database

## Alternative: Polling (temporary workaround)

If Realtime cannot be enabled, we can add polling as a temporary workaround, but this is not recommended for production.


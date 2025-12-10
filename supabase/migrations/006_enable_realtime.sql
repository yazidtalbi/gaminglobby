-- =====================================================================
-- ENABLE REALTIME FOR LOBBY_MEMBERS TABLE
-- =====================================================================
-- This ensures UPDATE events are broadcast via Supabase Realtime
-- Run this migration if UPDATE events are not being received

-- Enable Realtime for lobby_members table
-- This allows real-time subscriptions to receive INSERT, UPDATE, and DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_members;

-- Note: If the table is already in the publication, this will show a warning
-- which can be safely ignored.


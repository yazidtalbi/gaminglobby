-- Fix: Ensure notifications table is in realtime publication
-- This migration ensures the notifications table is properly set up for realtime

-- Add to publication (will fail silently if already exists, which is fine)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication, that's fine
    NULL;
  WHEN OTHERS THEN
    -- Re-raise other errors
    RAISE;
END $$;

-- Verify the trigger exists and is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_lobby_created_notifications'
  ) THEN
    RAISE EXCEPTION 'Trigger on_lobby_created_notifications does not exist. Please run migration 019 first.';
  END IF;
END $$;

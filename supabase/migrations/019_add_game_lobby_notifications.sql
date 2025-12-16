-- =====================================================================
-- GAME LOBBY NOTIFICATIONS SYSTEM
-- =====================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lobby_invite', 'game_lobby_created')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Store additional data like lobby_id, game_id, etc.
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Add global notification preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enable_lobby_notifications BOOLEAN DEFAULT true;

-- Add per-game notification preference to user_games
ALTER TABLE user_games ADD COLUMN IF NOT EXISTS enable_lobby_notifications BOOLEAN DEFAULT true;

-- Create index for notification preferences
CREATE INDEX IF NOT EXISTS idx_user_games_notifications ON user_games(user_id, game_id, enable_lobby_notifications);

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Function to create game lobby notifications
CREATE OR REPLACE FUNCTION public.create_game_lobby_notifications()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  game_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
  recent_notification_count INTEGER;
BEGIN
  -- Only process open/public lobbies (exclude invite_only and closed)
  IF NEW.status != 'open' OR COALESCE(NEW.visibility, 'public') = 'invite_only' THEN
    RETURN NEW;
  END IF;

  -- Get game name
  game_name := NEW.game_name;

  -- Find users who:
  -- 1. Have this game in their library
  -- 2. Have global notifications enabled (or NULL, default true)
  -- 3. Have per-game notifications enabled (or NULL, default true)
  -- 4. Are not the lobby creator
  FOR target_user_id IN
    SELECT DISTINCT ug.user_id
    FROM user_games ug
    INNER JOIN profiles p ON p.id = ug.user_id
    WHERE ug.game_id = NEW.game_id
      AND ug.user_id != NEW.host_id
      AND COALESCE(p.enable_lobby_notifications, true) = true
      AND COALESCE(ug.enable_lobby_notifications, true) = true
  LOOP
    -- Spam protection: Check if user received a notification for this game in the last 5 minutes
    SELECT COUNT(*) INTO recent_notification_count
    FROM notifications
    WHERE user_id = target_user_id
      AND type = 'game_lobby_created'
      AND data->>'game_id' = NEW.game_id::TEXT
      AND created_at > NOW() - INTERVAL '5 minutes';

    -- Rate limit: max 1 notification per game per 5 minutes
    IF recent_notification_count = 0 THEN
      -- Create notification
      notification_title := 'New ' || game_name || ' lobby is live';
      notification_body := 'A new lobby just opened — join while spots are available';

      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        target_user_id,
        'game_lobby_created',
        notification_title,
        notification_body,
        jsonb_build_object(
          'lobby_id', NEW.id,
          'game_id', NEW.game_id,
          'game_name', game_name
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notifications when a lobby is created
DROP TRIGGER IF EXISTS on_lobby_created_notifications ON lobbies;
CREATE TRIGGER on_lobby_created_notifications
  AFTER INSERT ON lobbies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_game_lobby_notifications();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================================
-- RECENT PLAYERS TABLE
-- =====================================================================
-- Tracks players that a user has encountered in lobbies
CREATE TABLE IF NOT EXISTS recent_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  encountered_player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE SET NULL,
  last_encountered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, encountered_player_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_players_user ON recent_players(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_players_encountered ON recent_players(encountered_player_id);
CREATE INDEX IF NOT EXISTS idx_recent_players_last_encountered ON recent_players(last_encountered_at DESC);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================
ALTER TABLE recent_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recent players" ON recent_players;
CREATE POLICY "Users can view their own recent players" ON recent_players FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recent players" ON recent_players;
CREATE POLICY "Users can insert their own recent players" ON recent_players FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recent players" ON recent_players;
CREATE POLICY "Users can update their own recent players" ON recent_players FOR UPDATE 
USING (auth.uid() = user_id);

-- =====================================================================
-- FUNCTION TO UPDATE RECENT PLAYERS
-- =====================================================================
-- This function can be called when a user joins a lobby to track encounters
CREATE OR REPLACE FUNCTION update_recent_players(
  p_user_id UUID,
  p_lobby_id UUID
)
RETURNS void AS $$
DECLARE
  v_other_member RECORD;
BEGIN
  -- For each other member in the lobby, update or insert recent player record
  FOR v_other_member IN
    SELECT DISTINCT lm.user_id
    FROM lobby_members lm
    WHERE lm.lobby_id = p_lobby_id
      AND lm.user_id != p_user_id
  LOOP
    INSERT INTO recent_players (user_id, encountered_player_id, lobby_id, last_encountered_at)
    VALUES (p_user_id, v_other_member.user_id, p_lobby_id, NOW())
    ON CONFLICT (user_id, encountered_player_id)
    DO UPDATE SET
      lobby_id = p_lobby_id,
      last_encountered_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


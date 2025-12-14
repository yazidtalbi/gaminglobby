-- =====================================================================
-- GAME SELECTED COVERS TABLE
-- =====================================================================
-- This table stores the founder-selected vertical cover for each game
-- When a founder selects a cover, it will be used throughout the app
-- instead of automatically fetching the first vertical cover

CREATE TABLE IF NOT EXISTS game_selected_covers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL UNIQUE, -- SteamGridDB game ID
  selected_cover_url TEXT NOT NULL,
  selected_cover_thumb TEXT NOT NULL,
  selected_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_selected_covers_game_id ON game_selected_covers(game_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_selected_covers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_game_selected_covers_updated_at
  BEFORE UPDATE ON game_selected_covers
  FOR EACH ROW
  EXECUTE FUNCTION update_game_selected_covers_updated_at();

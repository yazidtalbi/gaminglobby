-- Add selection phase tracking for top 3 games after vote ends
-- Migration: 013_add_game_selection_phase.sql

-- Table to track day/time selection phase for top 3 games
CREATE TABLE IF NOT EXISTS weekly_game_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES weekly_rounds(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES weekly_game_candidates(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  selected_day TEXT CHECK (selected_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  selected_time_slot TEXT CHECK (selected_time_slot IN ('morning', 'noon', 'afternoon', 'evening', 'late_night')),
  selection_deadline TIMESTAMPTZ NOT NULL,
  events_created BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, candidate_id)
);

-- Table to track user selections for each game
CREATE TABLE IF NOT EXISTS weekly_game_selection_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id UUID NOT NULL REFERENCES weekly_game_selections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_pref TEXT NOT NULL CHECK (day_pref IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  time_pref TEXT NOT NULL CHECK (time_pref IN ('morning', 'noon', 'afternoon', 'evening', 'late_night')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(selection_id, user_id)
);

-- Add selection_phase_status to weekly_rounds
ALTER TABLE weekly_rounds
ADD COLUMN IF NOT EXISTS selection_phase_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS selection_phase_completed BOOLEAN NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_game_selections_round_id ON weekly_game_selections(round_id);
CREATE INDEX IF NOT EXISTS idx_weekly_game_selections_deadline ON weekly_game_selections(selection_deadline);
CREATE INDEX IF NOT EXISTS idx_weekly_game_selection_votes_selection_id ON weekly_game_selection_votes(selection_id);
CREATE INDEX IF NOT EXISTS idx_weekly_game_selection_votes_user_id ON weekly_game_selection_votes(user_id);

-- Trigger for updated_at (drop if exists to allow re-running migration)
DROP TRIGGER IF EXISTS trigger_weekly_game_selections_updated_at ON weekly_game_selections;
CREATE TRIGGER trigger_weekly_game_selections_updated_at
  BEFORE UPDATE ON weekly_game_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_weekly_game_selection_votes_updated_at ON weekly_game_selection_votes;
CREATE TRIGGER trigger_weekly_game_selection_votes_updated_at
  BEFORE UPDATE ON weekly_game_selection_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE weekly_game_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view game selections" ON weekly_game_selections;
CREATE POLICY "Anyone can view game selections"
  ON weekly_game_selections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create selections (server-only)" ON weekly_game_selections;
CREATE POLICY "Authenticated users can create selections (server-only)"
  ON weekly_game_selections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update selections (server-only)" ON weekly_game_selections;
CREATE POLICY "Authenticated users can update selections (server-only)"
  ON weekly_game_selections FOR UPDATE
  USING (auth.role() = 'authenticated');

ALTER TABLE weekly_game_selection_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view selection votes" ON weekly_game_selection_votes;
CREATE POLICY "Anyone can view selection votes"
  ON weekly_game_selection_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own selection votes" ON weekly_game_selection_votes;
CREATE POLICY "Users can insert their own selection votes"
  ON weekly_game_selection_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own selection votes" ON weekly_game_selection_votes;
CREATE POLICY "Users can update their own selection votes"
  ON weekly_game_selection_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own selection votes" ON weekly_game_selection_votes;
CREATE POLICY "Users can delete their own selection votes"
  ON weekly_game_selection_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime (these will fail silently if already added, which is fine)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE weekly_game_selections;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE weekly_game_selection_votes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

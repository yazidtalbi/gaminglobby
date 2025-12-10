-- Weekly Community Events System
-- Migration: 007_add_weekly_events.sql

-- 1. Weekly Rounds Table
CREATE TABLE IF NOT EXISTS weekly_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key TEXT NOT NULL UNIQUE, -- e.g., "2025-W10" or ISO week string
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'processed')),
  voting_ends_at TIMESTAMPTZ NOT NULL,
  events_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Weekly Game Candidates Table
CREATE TABLE IF NOT EXISTS weekly_game_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES weekly_rounds(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- SteamGridDB game ID
  game_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, game_id)
);

-- 3. Weekly Game Votes Table
CREATE TABLE IF NOT EXISTS weekly_game_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES weekly_rounds(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES weekly_game_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_pref TEXT NOT NULL CHECK (time_pref IN ('morning', 'noon', 'afternoon', 'evening', 'late_night')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, user_id, candidate_id)
);

-- 4. Game Event Communities Table (one per game, for events)
CREATE TABLE IF NOT EXISTS game_event_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL UNIQUE, -- SteamGridDB game ID
  game_name TEXT NOT NULL,
  description TEXT,
  discord_link TEXT,
  created_from_round_id UUID REFERENCES weekly_rounds(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Game Event Community Members Table
CREATE TABLE IF NOT EXISTS game_event_community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES game_event_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'mod', 'owner')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL, -- SteamGridDB game ID
  game_name TEXT NOT NULL,
  community_id UUID NOT NULL REFERENCES game_event_communities(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES weekly_rounds(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('morning', 'noon', 'afternoon', 'evening', 'late_night')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'ended', 'cancelled')),
  total_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Event Participants Table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in' CHECK (status IN ('in', 'maybe', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 8. Event Guides Table (linking events to guides)
CREATE TABLE IF NOT EXISTS event_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES game_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, guide_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_rounds_status ON weekly_rounds(status);
CREATE INDEX IF NOT EXISTS idx_weekly_rounds_voting_ends_at ON weekly_rounds(voting_ends_at);
CREATE INDEX IF NOT EXISTS idx_weekly_game_candidates_round_id ON weekly_game_candidates(round_id);
CREATE INDEX IF NOT EXISTS idx_weekly_game_candidates_total_votes ON weekly_game_candidates(round_id, total_votes DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_game_votes_round_id ON weekly_game_votes(round_id);
CREATE INDEX IF NOT EXISTS idx_weekly_game_votes_candidate_id ON weekly_game_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_weekly_game_votes_user_id ON weekly_game_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_events_round_id ON events(round_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_game_id ON events(game_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_event_community_members_community_id ON game_event_community_members(community_id);

-- Function to update total_votes when votes are added/updated/deleted
CREATE OR REPLACE FUNCTION update_candidate_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE weekly_game_candidates
    SET total_votes = total_votes + 1
    WHERE id = NEW.candidate_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Vote count doesn't change on update (only time_pref changes)
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE weekly_game_candidates
    SET total_votes = GREATEST(0, total_votes - 1)
    WHERE id = OLD.candidate_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update vote counts
CREATE TRIGGER trigger_update_candidate_vote_count
  AFTER INSERT OR DELETE ON weekly_game_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_vote_count();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_weekly_rounds_updated_at
  BEFORE UPDATE ON weekly_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_weekly_game_votes_updated_at
  BEFORE UPDATE ON weekly_game_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_game_event_communities_updated_at
  BEFORE UPDATE ON game_event_communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_participants_updated_at
  BEFORE UPDATE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_game_candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_game_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_participants;

-- RLS Policies

-- Weekly Rounds: Everyone can read, only authenticated users can create (admin-only in practice)
ALTER TABLE weekly_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly rounds"
  ON weekly_rounds FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rounds"
  ON weekly_rounds FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Weekly Game Candidates: Everyone can read, authenticated users can create
ALTER TABLE weekly_game_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view candidates"
  ON weekly_game_candidates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create candidates"
  ON weekly_game_candidates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Weekly Game Votes: Users can read all votes, but only their own votes can be inserted/updated
ALTER TABLE weekly_game_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON weekly_game_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON weekly_game_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON weekly_game_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON weekly_game_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Game Event Communities: Everyone can read, authenticated users can create
ALTER TABLE game_event_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event communities"
  ON game_event_communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create event communities"
  ON game_event_communities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update event communities"
  ON game_event_communities FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Game Event Community Members: Everyone can read, users can manage their own membership
ALTER TABLE game_event_community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event community members"
  ON game_event_community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join event communities"
  ON game_event_community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave event communities"
  ON game_event_community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Events: Everyone can read, authenticated users can create
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Event Participants: Everyone can read, users can manage their own participation
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON event_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own participation"
  ON event_participants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Event Guides: Everyone can read, authenticated users can create
ALTER TABLE event_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event guides"
  ON event_guides FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create event guides"
  ON event_guides FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete event guides"
  ON event_guides FOR DELETE
  USING (auth.role() = 'authenticated');


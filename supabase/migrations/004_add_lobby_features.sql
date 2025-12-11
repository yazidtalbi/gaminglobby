-- =====================================================================
-- LOBBY BANS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS lobby_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lobby_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_lobby_bans_lobby ON lobby_bans(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_bans_player ON lobby_bans(player_id);

-- =====================================================================
-- ADD READY FIELD TO LOBBY_MEMBERS
-- =====================================================================
ALTER TABLE lobby_members 
ADD COLUMN IF NOT EXISTS ready BOOLEAN DEFAULT false;

-- =====================================================================
-- PLAYER ENDORSEMENTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS player_endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endorsed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  award_type TEXT NOT NULL CHECK (award_type IN ('good_teammate', 'strategic', 'friendly', 'chill')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, endorsed_by, award_type)
);

CREATE INDEX IF NOT EXISTS idx_player_endorsements_player ON player_endorsements(player_id);
CREATE INDEX IF NOT EXISTS idx_player_endorsements_type ON player_endorsements(award_type);

-- =====================================================================
-- PLAYER REPORTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS player_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('toxic_behavior', 'cheating', 'spam', 'other')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reported_player_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_player_reports_reported ON player_reports(reported_player_id);
CREATE INDEX IF NOT EXISTS idx_player_reports_reporter ON player_reports(reporter_id);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Lobby Bans
ALTER TABLE lobby_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can ban players" ON lobby_bans;
CREATE POLICY "Hosts can ban players" ON lobby_bans FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lobbies 
    WHERE lobbies.id = lobby_bans.lobby_id 
    AND lobbies.host_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view bans" ON lobby_bans;
CREATE POLICY "Anyone can view bans" ON lobby_bans FOR SELECT 
USING (true);

-- Player Endorsements
ALTER TABLE player_endorsements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can give endorsements" ON player_endorsements;
CREATE POLICY "Users can give endorsements" ON player_endorsements FOR INSERT 
WITH CHECK (auth.uid() = endorsed_by);

DROP POLICY IF EXISTS "Anyone can view endorsements" ON player_endorsements;
CREATE POLICY "Anyone can view endorsements" ON player_endorsements FOR SELECT 
USING (true);

-- Player Reports
ALTER TABLE player_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report others" ON player_reports;
CREATE POLICY "Users can report others" ON player_reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON player_reports;
CREATE POLICY "Users can view their own reports" ON player_reports FOR SELECT 
USING (auth.uid() = reporter_id);

-- =====================================================================
-- LOBBY MEMBERS UPDATE POLICY (for ready status)
-- =====================================================================
DROP POLICY IF EXISTS "Users can update own lobby member status" ON lobby_members;
CREATE POLICY "Users can update own lobby member status" ON lobby_members FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


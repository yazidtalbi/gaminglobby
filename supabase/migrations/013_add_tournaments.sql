-- Tournaments V1 Migration
-- Single elimination, 8/16 participants, free to join, Pro-only creation

-- 1. Tournaments table
CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  game_name text NOT NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('draft','open','registration_closed','in_progress','completed','cancelled')),
  max_participants int NOT NULL CHECK (max_participants IN (8,16)),
  current_participants int NOT NULL DEFAULT 0,
  platform text NOT NULL DEFAULT 'pc',
  start_at timestamptz NOT NULL,
  registration_deadline timestamptz NOT NULL,
  check_in_required boolean NOT NULL DEFAULT true,
  check_in_deadline timestamptz NOT NULL,
  rules text,
  discord_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_game_id ON tournaments(game_id);
CREATE INDEX idx_tournaments_host_id ON tournaments(host_id);
CREATE INDEX idx_tournaments_start_at ON tournaments(start_at);

-- 2. Tournament participants
CREATE TABLE tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seed int,
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered','checked_in','withdrawn','disqualified')),
  checked_in_at timestamptz,
  final_placement int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);

-- 3. Tournament matches
CREATE TABLE tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  match_number int NOT NULL,
  participant1_id uuid REFERENCES tournament_participants(id),
  participant2_id uuid REFERENCES tournament_participants(id),
  winner_id uuid REFERENCES tournament_participants(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','forfeited')),
  lobby_id uuid REFERENCES lobbies(id),
  score1 int DEFAULT 0,
  score2 int DEFAULT 0,
  outcome_method text DEFAULT 'manual'
    CHECK (outcome_method IN ('manual','forfeit','timeout','disconnect')),
  outcome_notes text,
  finalized_by uuid REFERENCES profiles(id),
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round_number, match_number)
);

CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX idx_tournament_matches_participant1_id ON tournament_matches(participant1_id);
CREATE INDEX idx_tournament_matches_participant2_id ON tournament_matches(participant2_id);

-- 4. Tournament match reports
CREATE TABLE tournament_match_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
  reporter_participant_id uuid NOT NULL REFERENCES tournament_participants(id),
  reporter_user_id uuid NOT NULL REFERENCES profiles(id),
  claimed_winner_participant_id uuid REFERENCES tournament_participants(id),
  claimed_score1 int,
  claimed_score2 int,
  claimed_method text DEFAULT 'manual',
  notes text,
  proof_paths text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','withdrawn','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, reporter_user_id)
);

CREATE INDEX idx_tournament_match_reports_match_id ON tournament_match_reports(match_id);
CREATE INDEX idx_tournament_match_reports_reporter_user_id ON tournament_match_reports(reporter_user_id);

-- 5. Tournament rewards
CREATE TABLE tournament_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id),
  reward_type text CHECK (reward_type IN ('badge','pro_days','visibility')),
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tournament_rewards_user_id ON tournament_rewards(user_id);
CREATE INDEX idx_tournament_rewards_tournament_id ON tournament_rewards(tournament_id);

-- 6. Profile badges
CREATE TABLE profile_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  badge_key text NOT NULL,
  label text NOT NULL,
  game_id text,
  tournament_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_key, tournament_id)
);

CREATE INDEX idx_profile_badges_user_id ON profile_badges(user_id);
CREATE INDEX idx_profile_badges_badge_key ON profile_badges(badge_key);

-- RLS Policies

-- Tournaments: Public read, authenticated write (Pro only enforced in API)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Users can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own tournaments"
  ON tournaments FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own tournaments"
  ON tournaments FOR DELETE
  USING (auth.uid() = host_id);

-- Tournament participants: Public read, authenticated write
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament participants are viewable by everyone"
  ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can register for tournaments"
  ON tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON tournament_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Tournament matches: Public read, host/admin write
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament matches are viewable by everyone"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Tournament hosts can manage matches"
  ON tournament_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_matches.tournament_id
      AND tournaments.host_id = auth.uid()
    )
  );

-- Tournament match reports: Participants can submit, hosts can view
ALTER TABLE tournament_match_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match reports are viewable by tournament host and participants"
  ON tournament_match_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_match_reports.tournament_id
      AND (
        tournaments.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tournament_participants
          WHERE tournament_participants.tournament_id = tournament_match_reports.tournament_id
          AND tournament_participants.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Participants can submit match reports"
  ON tournament_match_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Participants can update their own reports"
  ON tournament_match_reports FOR UPDATE
  USING (auth.uid() = reporter_user_id);

-- Tournament rewards: Server-only insert
ALTER TABLE tournament_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament rewards are viewable by everyone"
  ON tournament_rewards FOR SELECT
  USING (true);

-- Profile badges: Public read
ALTER TABLE profile_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile badges are viewable by everyone"
  ON profile_badges FOR SELECT
  USING (true);

-- Functions

-- Update tournament current_participants count
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tournament_participant_count
  AFTER INSERT OR DELETE ON tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_participant_count();

-- Update tournament updated_at
CREATE OR REPLACE FUNCTION update_tournament_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tournament_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_updated_at();

CREATE TRIGGER trigger_update_tournament_match_updated_at
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_updated_at();

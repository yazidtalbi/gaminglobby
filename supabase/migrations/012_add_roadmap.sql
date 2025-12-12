-- =====================================================================
-- ROADMAP SYSTEM
-- =====================================================================

-- Roadmap Items Table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'implemented', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_date DATE,
  category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'improvement', 'bug_fix', 'other')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_target_date ON roadmap_items(target_date);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category ON roadmap_items(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_order ON roadmap_items(order_index);

-- Feature Suggestions Table
CREATE TABLE IF NOT EXISTS feature_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'improvement', 'bug_fix', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'implemented')),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_suggestions_status ON feature_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_user ON feature_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_upvotes ON feature_suggestions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_created ON feature_suggestions(created_at DESC);

-- Feature Suggestion Upvotes Table
CREATE TABLE IF NOT EXISTS feature_suggestion_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_suggestion_upvotes_suggestion ON feature_suggestion_upvotes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_upvotes_user ON feature_suggestion_upvotes(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_roadmap_items_updated_at ON roadmap_items;
CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_suggestions_updated_at ON feature_suggestions;
CREATE TRIGGER update_feature_suggestions_updated_at
  BEFORE UPDATE ON feature_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update upvote count
CREATE OR REPLACE FUNCTION update_suggestion_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_suggestions
    SET upvotes = upvotes + 1
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_suggestions
    SET upvotes = upvotes - 1
    WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for upvote count
DROP TRIGGER IF EXISTS update_suggestion_upvotes_count ON feature_suggestion_upvotes;
CREATE TRIGGER update_suggestion_upvotes_count
  AFTER INSERT OR DELETE ON feature_suggestion_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestion_upvote_count();

-- Enable RLS
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestion_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roadmap_items
CREATE POLICY "Roadmap items are viewable by everyone" ON roadmap_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage roadmap items" ON roadmap_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.plan_tier = 'pro'
      AND (profiles.plan_expires_at IS NULL OR profiles.plan_expires_at > NOW())
    )
  );

-- RLS Policies for feature_suggestions
CREATE POLICY "Feature suggestions are viewable by everyone" ON feature_suggestions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create suggestions" ON feature_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions" ON feature_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for feature_suggestion_upvotes
CREATE POLICY "Upvotes are viewable by everyone" ON feature_suggestion_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote" ON feature_suggestion_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvotes" ON feature_suggestion_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE roadmap_items;
ALTER PUBLICATION supabase_realtime ADD TABLE feature_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE feature_suggestion_upvotes;


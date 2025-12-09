-- =====================================================================
-- SUPABASE SCHEMA FOR LOBBY MATCHMAKING APP
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- PROFILES TABLE
-- =====================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  discord_tag TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at);

-- =====================================================================
-- USER GAMES (LIBRARY)
-- =====================================================================
CREATE TABLE user_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- SteamGridDB ID
  game_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_games_user ON user_games(user_id);
CREATE INDEX idx_user_games_game ON user_games(game_id);

-- =====================================================================
-- FOLLOWS TABLE
-- =====================================================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- =====================================================================
-- GAME GUIDES TABLE
-- =====================================================================
CREATE TABLE game_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_guides_game ON game_guides(game_id);

-- =====================================================================
-- LOBBIES TABLE
-- =====================================================================
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_players INT,
  platform TEXT NOT NULL CHECK (platform IN ('pc', 'ps', 'xbox', 'switch', 'mobile', 'other')),
  discord_link TEXT,
  featured_guide_id UUID REFERENCES game_guides(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  host_last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lobbies_host ON lobbies(host_id);
CREATE INDEX idx_lobbies_game ON lobbies(game_id);
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_host_active ON lobbies(host_last_active_at);

-- =====================================================================
-- LOBBY MEMBERS TABLE
-- =====================================================================
CREATE TABLE lobby_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lobby_id, user_id)
);

CREATE INDEX idx_lobby_members_lobby ON lobby_members(lobby_id);
CREATE INDEX idx_lobby_members_user ON lobby_members(user_id);

-- =====================================================================
-- LOBBY MESSAGES TABLE
-- =====================================================================
CREATE TABLE lobby_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lobby_messages_lobby ON lobby_messages(lobby_id);
CREATE INDEX idx_lobby_messages_created ON lobby_messages(created_at);

-- =====================================================================
-- LOBBY INVITES TABLE
-- =====================================================================
CREATE TABLE lobby_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lobby_invites_lobby ON lobby_invites(lobby_id);
CREATE INDEX idx_lobby_invites_to_user ON lobby_invites(to_user_id);
CREATE INDEX idx_lobby_invites_status ON lobby_invites(status);

-- =====================================================================
-- GAME COMMUNITIES TABLE
-- =====================================================================
CREATE TABLE game_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discord', 'mumble', 'website', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_communities_game ON game_communities(game_id);

-- =====================================================================
-- GAME SEARCH EVENTS TABLE
-- =====================================================================
CREATE TABLE game_search_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_search_events_game ON game_search_events(game_id);
CREATE INDEX idx_game_search_events_created ON game_search_events(created_at);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_search_events ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User games: anyone can read, users can manage their own
CREATE POLICY "User games are viewable by everyone" ON user_games FOR SELECT USING (true);
CREATE POLICY "Users can manage own games" ON user_games FOR ALL USING (auth.uid() = user_id);

-- Follows: anyone can read, authenticated users can manage their own
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Lobbies: anyone can read, hosts can manage their own
CREATE POLICY "Lobbies are viewable by everyone" ON lobbies FOR SELECT USING (true);
CREATE POLICY "Users can create lobbies" ON lobbies FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own lobbies" ON lobbies FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete own lobbies" ON lobbies FOR DELETE USING (auth.uid() = host_id);

-- Lobby members: anyone can read, users can join/leave
CREATE POLICY "Lobby members are viewable by everyone" ON lobby_members FOR SELECT USING (true);
CREATE POLICY "Users can join lobbies" ON lobby_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave lobbies" ON lobby_members FOR DELETE USING (auth.uid() = user_id);

-- Lobby messages: lobby members can read/write
CREATE POLICY "Lobby messages are viewable by members" ON lobby_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM lobby_members WHERE lobby_members.lobby_id = lobby_messages.lobby_id AND lobby_members.user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON lobby_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM lobby_members WHERE lobby_members.lobby_id = lobby_messages.lobby_id AND lobby_members.user_id = auth.uid())
);

-- Lobby invites: users can view their own invites
CREATE POLICY "Users can view own invites" ON lobby_invites FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "Users can send invites" ON lobby_invites FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Recipients can update invites" ON lobby_invites FOR UPDATE USING (auth.uid() = to_user_id);

-- Game communities: anyone can read, authenticated users can add
CREATE POLICY "Communities are viewable by everyone" ON game_communities FOR SELECT USING (true);
CREATE POLICY "Users can add communities" ON game_communities FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Game guides: anyone can read, authenticated users can add
CREATE POLICY "Guides are viewable by everyone" ON game_guides FOR SELECT USING (true);
CREATE POLICY "Users can add guides" ON game_guides FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Game search events: anyone can insert
CREATE POLICY "Anyone can log search events" ON game_search_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Search events are viewable" ON game_search_events FOR SELECT USING (true);

-- =====================================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-add host as member when lobby is created
CREATE OR REPLACE FUNCTION public.handle_new_lobby()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lobby_members (lobby_id, user_id, role)
  VALUES (NEW.id, NEW.host_id, 'host');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new lobby
DROP TRIGGER IF EXISTS on_lobby_created ON lobbies;
CREATE TRIGGER on_lobby_created
  AFTER INSERT ON lobbies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_lobby();

-- Function to close inactive lobbies (called from app)
CREATE OR REPLACE FUNCTION public.close_inactive_lobbies()
RETURNS void AS $$
BEGIN
  UPDATE lobbies
  SET status = 'closed'
  WHERE status IN ('open', 'in_progress')
    AND host_last_active_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_members;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_invites;


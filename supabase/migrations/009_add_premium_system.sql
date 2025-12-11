-- =====================================================================
-- PREMIUM SYSTEM & COLLECTIONS MIGRATION (Idempotent)
-- =====================================================================

-- Add premium fields to profiles
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_profiles_plan_tier ON public.profiles(plan_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- =====================================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- =====================================================================
-- COLLECTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON public.collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_pinned ON public.collections(is_pinned, user_id);

-- =====================================================================
-- COLLECTION ITEMS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_position ON public.collection_items(collection_id, position);

-- =====================================================================
-- ENHANCE LOBBIES WITH PREMIUM FEATURES
-- =====================================================================
ALTER TABLE IF EXISTS public.lobbies
  ADD COLUMN IF NOT EXISTS auto_invite_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers_only', 'invite_only')),
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS role_tags TEXT[],
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_lobbies_visibility ON public.lobbies(visibility);
CREATE INDEX IF NOT EXISTS idx_lobbies_boosted ON public.lobbies(is_boosted, created_at);

-- =====================================================================
-- ENHANCE EVENTS SYSTEM
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured, starts_at);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Enable RLS (if tables exist)
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.collection_items ENABLE ROW LEVEL SECURITY;

-- === Subscriptions: users can view their own ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Users can view own subscriptions'
        AND schemaname = 'public'
        AND tablename = 'subscriptions'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can view own subscriptions"
          ON public.subscriptions
          FOR SELECT
          USING ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Users can view own subscriptions'
        AND n.nspname = 'public'
        AND c.relname = 'subscriptions'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can view own subscriptions"
          ON public.subscriptions
          FOR SELECT
          USING ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  END IF;
END;
$$;

-- === Collections: public collections are viewable ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Public collections are viewable'
        AND schemaname = 'public'
        AND tablename = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Public collections are viewable"
          ON public.collections
          FOR SELECT
          USING (is_public = TRUE OR (auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Public collections are viewable'
        AND n.nspname = 'public'
        AND c.relname = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Public collections are viewable"
          ON public.collections
          FOR SELECT
          USING (is_public = TRUE OR (auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  END IF;
END;
$$;

-- === Collections: Users can create collections (INSERT) ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Users can create collections'
        AND schemaname = 'public'
        AND tablename = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can create collections"
          ON public.collections
          FOR INSERT
          WITH CHECK ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Users can create collections'
        AND n.nspname = 'public'
        AND c.relname = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can create collections"
          ON public.collections
          FOR INSERT
          WITH CHECK ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  END IF;
END;
$$;

-- === Collections: Users can update own collections (UPDATE) ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Users can update own collections'
        AND schemaname = 'public'
        AND tablename = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can update own collections"
          ON public.collections
          FOR UPDATE
          USING ((auth.uid())::uuid = user_id)
          WITH CHECK ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Users can update own collections'
        AND n.nspname = 'public'
        AND c.relname = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can update own collections"
          ON public.collections
          FOR UPDATE
          USING ((auth.uid())::uuid = user_id)
          WITH CHECK ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  END IF;
END;
$$;

-- === Collections: Users can delete own collections (DELETE) ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Users can delete own collections'
        AND schemaname = 'public'
        AND tablename = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can delete own collections"
          ON public.collections
          FOR DELETE
          USING ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Users can delete own collections'
        AND n.nspname = 'public'
        AND c.relname = 'collections'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can delete own collections"
          ON public.collections
          FOR DELETE
          USING ((auth.uid())::uuid = user_id);
      $sql$;
    END IF;
  END IF;
END;
$$;

-- === Collection items: viewable if collection is public or owned by user ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Collection items are viewable'
        AND schemaname = 'public'
        AND tablename = 'collection_items'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Collection items are viewable"
          ON public.collection_items
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.collections
              WHERE public.collections.id = public.collection_items.collection_id
                AND (public.collections.is_public = TRUE OR (auth.uid())::uuid = public.collections.user_id)
            )
          );
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Collection items are viewable'
        AND n.nspname = 'public'
        AND c.relname = 'collection_items'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Collection items are viewable"
          ON public.collection_items
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.collections
              WHERE public.collections.id = public.collection_items.collection_id
                AND (public.collections.is_public = TRUE OR (auth.uid())::uuid = public.collections.user_id)
            )
          );
      $sql$;
    END IF;
  END IF;
END;
$$;

-- === Collection items: Users can manage own collection items (ALL) ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pg_catalog' AND c.relname = 'pg_policies'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE policyname = 'Users can manage own collection items'
        AND schemaname = 'public'
        AND tablename = 'collection_items'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can manage own collection items"
          ON public.collection_items
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.collections
              WHERE public.collections.id = public.collection_items.collection_id
                AND (auth.uid())::uuid = public.collections.user_id
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.collections
              WHERE public.collections.id = public.collection_items.collection_id
                AND (auth.uid())::uuid = public.collections.user_id
            )
          );
      $sql$;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE p.polname = 'Users can manage own collection items'
        AND n.nspname = 'public'
        AND c.relname = 'collection_items'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY "Users can manage own collection items"
          ON public.collection_items
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.collections
              WHERE public.collections.id = public.collection_items.collection_id
                AND (auth.uid())::uuid = public.collections.user_id
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.collections
              WHERE public.collections.id = public.collection_items.collection_id
                AND (auth.uid())::uuid = public.collections.user_id
            )
          );
      $sql$;
    END IF;
  END IF;
END;
$$;

-- =====================================================================
-- FUNCTIONS
-- =====================================================================

-- Function to check if user is Pro
CREATE OR REPLACE FUNCTION public.is_pro_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid 
      AND plan_tier = 'pro' 
      AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile plan_tier based on subscription status
  IF NEW.status = 'active' AND NEW.current_period_end > NOW() THEN
    UPDATE public.profiles 
    SET plan_tier = 'pro', plan_expires_at = NEW.current_period_end
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'past_due', 'unpaid') THEN
    UPDATE public.profiles 
    SET plan_tier = 'free', plan_expires_at = NULL
    WHERE id = NEW.user_id;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subscription updates: recreate idempotently
DROP TRIGGER IF EXISTS on_subscription_updated ON public.subscriptions;
CREATE TRIGGER on_subscription_updated
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_status();

-- Function to update collection updated_at
CREATE OR REPLACE FUNCTION public.update_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for collection updates: recreate idempotently
DROP TRIGGER IF EXISTS on_collection_updated ON public.collections;
CREATE TRIGGER on_collection_updated
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_collection_updated_at();

-- Add preferred_platform to profiles table
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_platform TEXT CHECK (preferred_platform IN ('pc', 'playstation', 'xbox', 'switch', 'mobile', 'other'));

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_platform ON public.profiles(preferred_platform);


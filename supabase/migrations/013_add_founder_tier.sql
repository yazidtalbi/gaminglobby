-- =====================================================================
-- ADD FOUNDER TIER TO PLAN_TIER
-- =====================================================================

-- Drop the existing CHECK constraint
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;

-- Add the new CHECK constraint with 'founder' included
ALTER TABLE IF EXISTS public.profiles 
  ADD CONSTRAINT profiles_plan_tier_check 
  CHECK (plan_tier IN ('free', 'pro', 'founder'));

-- Update is_pro_user function to include founder
CREATE OR REPLACE FUNCTION public.is_pro_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid 
      AND (plan_tier = 'pro' OR plan_tier = 'founder')
      AND (
        plan_tier = 'founder' OR 
        plan_expires_at IS NULL OR 
        plan_expires_at > NOW()
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

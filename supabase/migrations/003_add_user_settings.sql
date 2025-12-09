-- Add user settings fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_invites BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invites_from_followers_only BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create index for privacy filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_private ON profiles(is_private);


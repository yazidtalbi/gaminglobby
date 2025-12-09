-- Add cover_image_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- =====================================================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- =====================================================================
-- Note: Storage bucket must be created manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket named "avatars"
-- 3. Set it to Public
-- 4. Then run the policies below in SQL Editor

-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to avatars
CREATE POLICY IF NOT EXISTS "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');


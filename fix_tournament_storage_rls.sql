-- Quick fix for tournament-proofs storage bucket RLS
-- Run this in Supabase SQL Editor

-- 1. First, create the bucket in Supabase Dashboard > Storage if not exists:
--    Name: tournament-proofs
--    Public: false

-- 2. Then run these policies:

-- Allow authenticated users to upload (API validates participant status)
CREATE POLICY "Allow authenticated uploads to tournament-proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL
);

-- Allow users to read files they uploaded (userId in path)
CREATE POLICY "Users can read their own tournament proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL AND
  (string_to_array(name, '/'))[4] = auth.uid()::text
);

-- Allow tournament hosts to read all proofs in their tournaments
CREATE POLICY "Hosts can read tournament proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM tournaments
    WHERE tournaments.id::text = (string_to_array(name, '/'))[2]
    AND tournaments.host_id = auth.uid()
  )
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own tournament proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL AND
  (string_to_array(name, '/'))[4] = auth.uid()::text
);

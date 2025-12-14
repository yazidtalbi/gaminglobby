-- Storage policies for tournament-proofs bucket
-- This bucket stores match proof screenshots

-- IMPORTANT: First create the bucket in Supabase Dashboard > Storage
-- Name: tournament-proofs
-- Public: false (private)

-- Policy: Authenticated users can upload to tournament-proofs
-- The API route validates that the user is a participant in the match
CREATE POLICY "Authenticated users can upload match proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL
);

-- Policy: Users can view their own uploaded files
CREATE POLICY "Users can view their own match proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL AND
  -- Path format: tournaments/{tournamentId}/matches/{matchId}/{userId}/{filename}
  -- Check if userId in path matches auth.uid()
  (string_to_array(name, '/'))[4] = auth.uid()::text
);

-- Policy: Tournament hosts can view all match proofs in their tournaments
CREATE POLICY "Tournament hosts can view match proofs"
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

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete their own match proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tournament-proofs' AND
  auth.uid() IS NOT NULL AND
  (string_to_array(name, '/'))[4] = auth.uid()::text
);

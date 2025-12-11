-- =====================================================================
-- ADD UPDATE POLICY FOR LOBBY_MEMBERS (for ready status)
-- =====================================================================
-- This allows users to update their own ready status in lobby_members

DROP POLICY IF EXISTS "Users can update own lobby member status" ON lobby_members;
CREATE POLICY "Users can update own lobby member status" ON lobby_members 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


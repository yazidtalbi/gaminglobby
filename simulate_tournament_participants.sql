-- Simulate 8 checked-in participants for tournament: 3cbe4554-7a54-42c6-97ab-85c451f0efdc
-- Run these commands in your Supabase SQL editor

-- Step 1: Check current state
SELECT 
  t.id,
  t.title,
  t.max_participants,
  t.current_participants,
  COUNT(tp.id) as actual_participants,
  COUNT(CASE WHEN tp.status = 'checked_in' THEN 1 END) as checked_in_count
FROM tournaments t
LEFT JOIN tournament_participants tp ON tp.tournament_id = t.id
WHERE t.id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
GROUP BY t.id, t.title, t.max_participants, t.current_participants;

-- Step 2: Get existing participant (if any) and some user IDs to use
SELECT 
  tp.id as participant_id,
  tp.user_id,
  tp.status,
  p.username,
  p.display_name
FROM tournament_participants tp
JOIN profiles p ON p.id = tp.user_id
WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc';

-- Step 3: Get 8 user IDs from profiles (excluding the host if needed)
-- This will get 8 random users, or you can specify specific user IDs
SELECT id, username, display_name 
FROM profiles 
WHERE id NOT IN (
  SELECT host_id FROM tournaments WHERE id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
LIMIT 8;

-- Step 4: Delete existing participants (optional - only if you want to start fresh)
-- DELETE FROM tournament_participants 
-- WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc';

-- Step 5: Insert 8 checked-in participants
-- Replace the user IDs below with actual user IDs from your profiles table
-- You can get user IDs by running Step 3 first

-- Option A: If you have specific user IDs, use this:
/*
INSERT INTO tournament_participants (tournament_id, user_id, status, checked_in_at)
VALUES
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_1_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_2_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_3_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_4_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_5_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_6_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_7_HERE', 'checked_in', now()),
  ('3cbe4554-7a54-42c6-97ab-85c451f0efdc', 'USER_ID_8_HERE', 'checked_in', now())
ON CONFLICT (tournament_id, user_id) 
DO UPDATE SET 
  status = 'checked_in',
  checked_in_at = now();
*/

-- Option B: Auto-generate using existing users (this will use the first 8 users from profiles)
-- WARNING: Make sure these users exist and are not the host
WITH selected_users AS (
  SELECT id 
  FROM profiles 
  WHERE id NOT IN (
    SELECT host_id FROM tournaments WHERE id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  )
  AND id NOT IN (
    SELECT user_id FROM tournament_participants WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  )
  LIMIT 8
)
INSERT INTO tournament_participants (tournament_id, user_id, status, checked_in_at)
SELECT 
  '3cbe4554-7a54-42c6-97ab-85c451f0efdc',
  id,
  'checked_in',
  now()
FROM selected_users
ON CONFLICT (tournament_id, user_id) 
DO UPDATE SET 
  status = 'checked_in',
  checked_in_at = now();

-- Step 6: Update existing participants to checked_in status (if you already have participants)
UPDATE tournament_participants
SET 
  status = 'checked_in',
  checked_in_at = COALESCE(checked_in_at, now())
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND status != 'checked_in';

-- Step 7: If you need to add more participants to reach 8, use this:
-- First, count how many you have
WITH current_count AS (
  SELECT COUNT(*) as count
  FROM tournament_participants
  WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND status = 'checked_in'
),
needed AS (
  SELECT 8 - (SELECT count FROM current_count) as needed_count
)
INSERT INTO tournament_participants (tournament_id, user_id, status, checked_in_at)
SELECT 
  '3cbe4554-7a54-42c6-97ab-85c451f0efdc',
  p.id,
  'checked_in',
  now()
FROM profiles p
CROSS JOIN needed n
WHERE p.id NOT IN (
  SELECT host_id FROM tournaments WHERE id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
AND p.id NOT IN (
  SELECT user_id FROM tournament_participants WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
LIMIT (SELECT needed_count FROM needed)
ON CONFLICT (tournament_id, user_id) 
DO UPDATE SET 
  status = 'checked_in',
  checked_in_at = now();

-- Step 8: Verify you have 8 checked-in participants
SELECT 
  COUNT(*) as checked_in_count,
  COUNT(*) FILTER (WHERE status = 'checked_in') as verified_checked_in
FROM tournament_participants
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND status = 'checked_in';

-- Step 9: The trigger should update current_participants automatically, but if not, manually update:
-- UPDATE tournaments 
-- SET current_participants = (
--   SELECT COUNT(*) 
--   FROM tournament_participants 
--   WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
-- )
-- WHERE id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc';

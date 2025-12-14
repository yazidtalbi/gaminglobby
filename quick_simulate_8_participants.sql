-- Quick SQL to simulate 8 checked-in participants
-- Tournament ID: 3cbe4554-7a54-42c6-97ab-85c451f0efdc

-- Step 1: Update existing participant to checked_in (if you have one)
UPDATE tournament_participants
SET 
  status = 'checked_in',
  checked_in_at = COALESCE(checked_in_at, now())
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc';

-- Step 2: Add remaining participants to reach 8 checked-in
-- This will automatically select users that aren't the host and aren't already participants
WITH needed_count AS (
  SELECT GREATEST(0, 8 - COUNT(*)) as needed
  FROM tournament_participants
  WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND status = 'checked_in'
)
INSERT INTO tournament_participants (tournament_id, user_id, status, checked_in_at)
SELECT 
  '3cbe4554-7a54-42c6-97ab-85c451f0efdc',
  p.id,
  'checked_in',
  now()
FROM profiles p
CROSS JOIN needed_count n
WHERE p.id NOT IN (
  SELECT host_id FROM tournaments WHERE id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
AND p.id NOT IN (
  SELECT user_id FROM tournament_participants WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
LIMIT (SELECT needed FROM needed_count)
ON CONFLICT (tournament_id, user_id) 
DO UPDATE SET 
  status = 'checked_in',
  checked_in_at = now();

-- Step 3: Verify you have 8 checked-in participants
SELECT 
  COUNT(*) as total_participants,
  COUNT(*) FILTER (WHERE status = 'checked_in') as checked_in_count,
  array_agg(p.username || ' (' || p.display_name || ')') as participant_names
FROM tournament_participants tp
JOIN profiles p ON p.id = tp.user_id
WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND tp.status = 'checked_in';

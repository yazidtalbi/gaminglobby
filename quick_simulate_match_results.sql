-- Quick SQL to simulate tournament match results
-- Tournament ID: 3cbe4554-7a54-42c6-97ab-85c451f0efdc
-- This script completes all pending matches and advances winners

-- Step 1: Complete remaining Round 1 matches
-- Match 2: Set winner to participant1 (first participant)
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 5,
  score2 = 2,
  winner_id = participant1_id,
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 1
  AND match_number = 2
  AND status = 'pending';

-- Match 3: Set winner to participant2 (second participant)
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 2,
  score2 = 4,
  winner_id = participant2_id,
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 1
  AND match_number = 3
  AND status = 'pending';

-- Match 4: Set winner to participant1 (first participant)
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 6,
  score2 = 1,
  winner_id = participant1_id,
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 1
  AND match_number = 4
  AND status = 'pending';

-- Step 2: Advance winners to Round 2
-- Round 2, Match 1: Winner of R1M1 vs Winner of R1M2
UPDATE tournament_matches tm
SET 
  participant1_id = (
    SELECT winner_id FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND round_number = 1 AND match_number = 1
  ),
  participant2_id = (
    SELECT winner_id FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND round_number = 1 AND match_number = 2
  ),
  updated_at = now()
WHERE tm.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND tm.round_number = 2
  AND tm.match_number = 1;

-- Round 2, Match 2: Winner of R1M3 vs Winner of R1M4
UPDATE tournament_matches tm
SET 
  participant1_id = (
    SELECT winner_id FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND round_number = 1 AND match_number = 3
  ),
  participant2_id = (
    SELECT winner_id FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND round_number = 1 AND match_number = 4
  ),
  updated_at = now()
WHERE tm.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND tm.round_number = 2
  AND tm.match_number = 2;

-- Step 3: Complete Round 2 matches
-- Round 2, Match 1: Winner is participant1
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 4,
  score2 = 2,
  winner_id = participant1_id,
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 2
  AND match_number = 1
  AND status = 'pending';

-- Round 2, Match 2: Winner is participant2
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 2,
  score2 = 5,
  winner_id = participant2_id,
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 2
  AND match_number = 2
  AND status = 'pending';

-- Step 4: Advance winners to Round 3 (Final)
UPDATE tournament_matches tm
SET 
  participant1_id = (
    SELECT winner_id FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND round_number = 2 AND match_number = 1
  ),
  participant2_id = (
    SELECT winner_id FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND round_number = 2 AND match_number = 2
  ),
  updated_at = now()
WHERE tm.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND tm.round_number = 3
  AND tm.match_number = 1;

-- Step 5: Complete Final (Round 3, Match 1) - Winner is participant1
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 5,
  score2 = 3,
  winner_id = participant1_id,
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 3
  AND match_number = 1
  AND status = 'pending';

-- Step 6: Verify results
SELECT 
  tm.round_number,
  tm.match_number,
  tm.status,
  p1_profile.username as p1_name,
  p1_profile.display_name as p1_display_name,
  p2_profile.username as p2_name,
  p2_profile.display_name as p2_display_name,
  tm.score1,
  tm.score2,
  w_profile.username as winner_name,
  w_profile.display_name as winner_display_name
FROM tournament_matches tm
LEFT JOIN tournament_participants p1 ON p1.id = tm.participant1_id
LEFT JOIN profiles p1_profile ON p1_profile.id = p1.user_id
LEFT JOIN tournament_participants p2 ON p2.id = tm.participant2_id
LEFT JOIN profiles p2_profile ON p2_profile.id = p2.user_id
LEFT JOIN tournament_participants w ON w.id = tm.winner_id
LEFT JOIN profiles w_profile ON w_profile.id = w.user_id
WHERE tm.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
ORDER BY tm.round_number, tm.match_number;

-- Step 7: Mark tournament as completed if all matches are done
UPDATE tournaments
SET 
  status = 'completed',
  updated_at = now()
WHERE id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND NOT EXISTS (
    SELECT 1 FROM tournament_matches
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND status != 'completed'
  );

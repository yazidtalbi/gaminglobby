-- Simulate/Seed Tournament Match Results
-- Tournament ID: 3cbe4554-7a54-42c6-97ab-85c451f0efdc
-- This will complete all pending matches and advance winners through the bracket

-- Step 1: View current matches and their status
SELECT 
  tm.id,
  tm.round_number,
  tm.match_number,
  tm.status,
  p1_profile.username as participant1,
  p1_profile.display_name as participant1_display,
  p2_profile.username as participant2,
  p2_profile.display_name as participant2_display,
  tm.score1,
  tm.score2,
  w_profile.username as winner,
  w_profile.display_name as winner_display
FROM tournament_matches tm
LEFT JOIN tournament_participants p1 ON p1.id = tm.participant1_id
LEFT JOIN profiles p1_profile ON p1_profile.id = p1.user_id
LEFT JOIN tournament_participants p2 ON p2.id = tm.participant2_id
LEFT JOIN profiles p2_profile ON p2_profile.id = p2.user_id
LEFT JOIN tournament_participants w ON w.id = tm.winner_id
LEFT JOIN profiles w_profile ON w_profile.id = w.user_id
WHERE tm.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
ORDER BY tm.round_number, tm.match_number;

-- Step 2: Complete Round 1 matches (assuming Match 1 is already completed: kage vs bunshin)
-- Match 2: krank56 vs tactical ops
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 5,
  score2 = 2,
  winner_id = (
    SELECT id FROM tournament_participants tp
    JOIN profiles p ON p.id = tp.user_id
    WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND (p.username = 'krank56' OR p.display_name = 'krank56')
    LIMIT 1
  ),
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 1
  AND match_number = 2
  AND status = 'pending';

-- Match 3: naruto vs el_matador
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 3,
  score2 = 4,
  winner_id = (
    SELECT id FROM tournament_participants tp
    JOIN profiles p ON p.id = tp.user_id
    WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND (p.username = 'el_matador' OR p.display_name = 'el_matador')
    LIMIT 1
  ),
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 1
  AND match_number = 3
  AND status = 'pending';

-- Match 4: itachi vs sasuke
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 6,
  score2 = 1,
  winner_id = (
    SELECT id FROM tournament_participants tp
    JOIN profiles p ON p.id = tp.user_id
    WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
    AND (p.username = 'itachi' OR p.display_name = 'itachi')
    LIMIT 1
  ),
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 1
  AND match_number = 4
  AND status = 'pending';

-- Step 3: Advance winners to Round 2
-- Round 2, Match 1: kage (winner of R1M1) vs krank56 (winner of R1M2)
UPDATE tournament_matches
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
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 2
  AND match_number = 1;

-- Round 2, Match 2: el_matador (winner of R1M3) vs itachi (winner of R1M4)
UPDATE tournament_matches
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
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 2
  AND match_number = 2;

-- Step 4: Complete Round 2 matches
-- Round 2, Match 1: kage vs krank56 (kage wins)
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 4,
  score2 = 2,
  winner_id = participant1_id, -- kage
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 2
  AND match_number = 1
  AND status = 'pending';

-- Round 2, Match 2: el_matador vs itachi (itachi wins)
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 2,
  score2 = 5,
  winner_id = participant2_id, -- itachi
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 2
  AND match_number = 2
  AND status = 'pending';

-- Step 5: Advance winners to Round 3 (Final)
-- Round 3, Match 1: kage (winner of R2M1) vs itachi (winner of R2M2)
UPDATE tournament_matches
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
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 3
  AND match_number = 1;

-- Step 6: Complete Final (Round 3, Match 1) - kage wins the tournament
UPDATE tournament_matches
SET 
  status = 'completed',
  score1 = 5,
  score2 = 3,
  winner_id = participant1_id, -- kage
  finalized_at = now(),
  updated_at = now()
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND round_number = 3
  AND match_number = 1
  AND status = 'pending';

-- Step 7: Verify all matches are completed
SELECT 
  tm.round_number,
  tm.match_number,
  tm.status,
  p1_profile.username as participant1,
  p1_profile.display_name as participant1_display,
  p2_profile.username as participant2,
  p2_profile.display_name as participant2_display,
  tm.score1,
  tm.score2,
  w_profile.username as winner,
  w_profile.display_name as winner_display
FROM tournament_matches tm
LEFT JOIN tournament_participants p1 ON p1.id = tm.participant1_id
LEFT JOIN profiles p1_profile ON p1_profile.id = p1.user_id
LEFT JOIN tournament_participants p2 ON p2.id = tm.participant2_id
LEFT JOIN profiles p2_profile ON p2_profile.id = p2.user_id
LEFT JOIN tournament_participants w ON w.id = tm.winner_id
LEFT JOIN profiles w_profile ON w_profile.id = w.user_id
WHERE tm.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
ORDER BY tm.round_number, tm.match_number;

-- Step 8: Update tournament status to completed (if all matches are done)
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

-- Seed Final Standings for Tournament: 3cbe4554-7a54-42c6-97ab-85c451f0efdc
-- This updates final_placement for all participants based on match results

-- Step 1: Get the final match winner (1st place)
UPDATE tournament_participants
SET final_placement = 1
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT winner_id 
    FROM tournament_matches 
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = (
        SELECT MAX(round_number) 
        FROM tournament_matches 
        WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      )
      AND match_number = 1
  );

-- Step 2: Get the final match runner-up (2nd place)
UPDATE tournament_participants
SET final_placement = 2
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id IN (
    SELECT 
      CASE 
        WHEN winner_id = participant1_id THEN participant2_id
        ELSE participant1_id
      END as runner_up_id
    FROM tournament_matches 
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = (
        SELECT MAX(round_number) 
        FROM tournament_matches 
        WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      )
      AND match_number = 1
      AND status = 'completed'
  );

-- Step 3: Get semifinal losers (3rd and 4th place)
-- For 8-person tournament: losers of Round 2 (semifinals) get 3rd/4th
-- For 16-person tournament: losers of Round 3 (semifinals) get 3rd/4th

-- Get the semifinal round number
WITH semifinal_round AS (
  SELECT MAX(round_number) - 1 as round_num
  FROM tournament_matches
  WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
-- Update 3rd place (first semifinal loser)
UPDATE tournament_participants
SET final_placement = 3
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT 
      CASE 
        WHEN winner_id = participant1_id THEN participant2_id
        ELSE participant1_id
      END as loser_id
    FROM tournament_matches, semifinal_round
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = semifinal_round.round_num
      AND match_number = 1
      AND status = 'completed'
    LIMIT 1
  );

-- Update 4th place (second semifinal loser)
WITH semifinal_round AS (
  SELECT MAX(round_number) - 1 as round_num
  FROM tournament_matches
  WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
)
UPDATE tournament_participants
SET final_placement = 4
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT 
      CASE 
        WHEN winner_id = participant1_id THEN participant2_id
        ELSE participant1_id
      END as loser_id
    FROM tournament_matches, semifinal_round
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = semifinal_round.round_num
      AND match_number = 2
      AND status = 'completed'
    LIMIT 1
  );

-- Step 4: Verify final standings
SELECT 
  tp.final_placement,
  p.username,
  p.display_name,
  tp.status
FROM tournament_participants tp
JOIN profiles p ON p.id = tp.user_id
WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND tp.final_placement IS NOT NULL
ORDER BY tp.final_placement ASC;

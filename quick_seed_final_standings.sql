-- Quick SQL to seed final standings based on match results
-- Tournament ID: 3cbe4554-7a54-42c6-97ab-85c451f0efdc

-- 1st Place: Winner of the final match (Round 3, Match 1)
UPDATE tournament_participants
SET final_placement = 1
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT winner_id 
    FROM tournament_matches 
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = 3
      AND match_number = 1
      AND status = 'completed'
  );

-- 2nd Place: Runner-up of the final match
UPDATE tournament_participants
SET final_placement = 2
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT 
      CASE 
        WHEN winner_id = participant1_id THEN participant2_id
        ELSE participant1_id
      END
    FROM tournament_matches 
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = 3
      AND match_number = 1
      AND status = 'completed'
  );

-- 3rd Place: Loser of Round 2, Match 1 (semifinal)
UPDATE tournament_participants
SET final_placement = 3
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT 
      CASE 
        WHEN winner_id = participant1_id THEN participant2_id
        ELSE participant1_id
      END
    FROM tournament_matches 
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = 2
      AND match_number = 1
      AND status = 'completed'
  );

-- 4th Place: Loser of Round 2, Match 2 (semifinal)
UPDATE tournament_participants
SET final_placement = 4
WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
  AND id = (
    SELECT 
      CASE 
        WHEN winner_id = participant1_id THEN participant2_id
        ELSE participant1_id
      END
    FROM tournament_matches 
    WHERE tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
      AND round_number = 2
      AND match_number = 2
      AND status = 'completed'
  );

-- Verify results
SELECT 
  tp.final_placement,
  p.username,
  p.display_name,
  CASE tp.final_placement
    WHEN 1 THEN '🥇 Champion'
    WHEN 2 THEN '🥈 Runner-up'
    WHEN 3 THEN '🥉 3rd Place'
    WHEN 4 THEN '4th Place'
    ELSE 'Participant'
  END as standing
FROM tournament_participants tp
JOIN profiles p ON p.id = tp.user_id
WHERE tp.tournament_id = '3cbe4554-7a54-42c6-97ab-85c451f0efdc'
ORDER BY 
  CASE 
    WHEN tp.final_placement IS NULL THEN 999
    ELSE tp.final_placement
  END ASC,
  p.username ASC;

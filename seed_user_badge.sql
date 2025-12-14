-- Seed a badge for user "kage" (username)
-- This will create a tournament winner badge for the "HUNTDOWN FOR EVERYONE" tournament

-- First, get the user ID and tournament ID
DO $$
DECLARE
  user_uuid UUID;
  tournament_uuid UUID;
  tournament_badge_image_url TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO user_uuid
  FROM profiles
  WHERE username = 'kage'
  LIMIT 1;

  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User "kage" not found';
  END IF;

  -- Get the "HUNTDOWN FOR EVERYONE" tournament (or any completed tournament)
  SELECT id, badge_1st_image_url INTO tournament_uuid, tournament_badge_image_url
  FROM tournaments
  WHERE title ILIKE '%HUNTDOWN%' OR status = 'completed'
  ORDER BY CASE WHEN title ILIKE '%HUNTDOWN%' THEN 1 ELSE 2 END
  LIMIT 1;

  IF tournament_uuid IS NULL THEN
    RAISE EXCEPTION 'No completed tournament found';
  END IF;

  -- Insert the badge with the tournament's custom badge image if available
  INSERT INTO profile_badges (
    user_id,
    badge_key,
    label,
    tournament_id,
    image_url
  ) VALUES (
    user_uuid,
    'tournament_winner',
    COALESCE(
      (SELECT badge_1st_label FROM tournaments WHERE id = tournament_uuid),
      'Champion'
    ),
    tournament_uuid,
    tournament_badge_image_url
  )
  ON CONFLICT (user_id, badge_key, tournament_id) 
  DO UPDATE SET
    label = EXCLUDED.label,
    image_url = EXCLUDED.image_url;

  RAISE NOTICE 'Badge created for user % in tournament %', user_uuid, tournament_uuid;
END $$;

-- Verify the badge was created
SELECT 
  pb.*,
  p.username,
  p.display_name,
  t.title as tournament_title
FROM profile_badges pb
JOIN profiles p ON p.id = pb.user_id
LEFT JOIN tournaments t ON t.id = pb.tournament_id
WHERE p.username = 'kage';

-- =====================================================================
-- FIX: Update recent_players function to include host
-- =====================================================================
-- The previous function only tracked lobby_members, missing the host.
-- This update makes it bidirectional and includes the host so that:
-- 1. Joining users see the host in their recent players
-- 2. Hosts see joining users in their recent players
-- =====================================================================

CREATE OR REPLACE FUNCTION update_recent_players(
  p_user_id UUID,
  p_lobby_id UUID
)
RETURNS void AS $$
DECLARE
  v_other_player RECORD;
  v_host_id UUID;
BEGIN
  -- Get the lobby host
  SELECT host_id INTO v_host_id
  FROM lobbies
  WHERE id = p_lobby_id;

  -- 1. Add all other members AND host to the joining user's recent players
  FOR v_other_player IN
    SELECT DISTINCT player_id
    FROM (
      SELECT lm.user_id as player_id
      FROM lobby_members lm
      WHERE lm.lobby_id = p_lobby_id
        AND lm.user_id != p_user_id
      UNION
      SELECT v_host_id as player_id
      WHERE v_host_id IS NOT NULL
        AND v_host_id != p_user_id
    ) all_players
  LOOP
    INSERT INTO recent_players (user_id, encountered_player_id, lobby_id, last_encountered_at)
    VALUES (p_user_id, v_other_player.player_id, p_lobby_id, NOW())
    ON CONFLICT (user_id, encountered_player_id)
    DO UPDATE SET
      lobby_id = p_lobby_id,
      last_encountered_at = NOW();
  END LOOP;

  -- 2. Add the joining user to all other members' recent players (bidirectional)
  FOR v_other_player IN
    SELECT DISTINCT lm.user_id as player_id
    FROM lobby_members lm
    WHERE lm.lobby_id = p_lobby_id
      AND lm.user_id != p_user_id
  LOOP
    INSERT INTO recent_players (user_id, encountered_player_id, lobby_id, last_encountered_at)
    VALUES (v_other_player.player_id, p_user_id, p_lobby_id, NOW())
    ON CONFLICT (user_id, encountered_player_id)
    DO UPDATE SET
      lobby_id = p_lobby_id,
      last_encountered_at = NOW();
  END LOOP;

  -- 3. Add the joining user to the host's recent players (if host exists and is not the joining user)
  IF v_host_id IS NOT NULL AND v_host_id != p_user_id THEN
    INSERT INTO recent_players (user_id, encountered_player_id, lobby_id, last_encountered_at)
    VALUES (v_host_id, p_user_id, p_lobby_id, NOW())
    ON CONFLICT (user_id, encountered_player_id)
    DO UPDATE SET
      lobby_id = p_lobby_id,
      last_encountered_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

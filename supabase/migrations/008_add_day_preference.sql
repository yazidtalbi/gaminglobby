-- Add day_pref column to weekly_game_votes table
ALTER TABLE weekly_game_votes 
ADD COLUMN IF NOT EXISTS day_pref TEXT CHECK (day_pref IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));

-- Add day_slot column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS day_slot TEXT CHECK (day_slot IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));


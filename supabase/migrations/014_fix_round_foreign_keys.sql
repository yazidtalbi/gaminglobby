-- Fix foreign key constraint to allow deletion of weekly_rounds
-- Migration: 014_fix_round_foreign_keys.sql

-- Fix game_event_communities.created_from_round_id
-- Drop the existing constraint and recreate with ON DELETE SET NULL
-- This allows communities to persist even if the round is deleted
ALTER TABLE game_event_communities
DROP CONSTRAINT IF EXISTS game_event_communities_created_from_round_id_fkey;

-- Recreate with ON DELETE SET NULL (communities should persist even if round is deleted)
ALTER TABLE game_event_communities
ADD CONSTRAINT game_event_communities_created_from_round_id_fkey
FOREIGN KEY (created_from_round_id)
REFERENCES weekly_rounds(id)
ON DELETE SET NULL;

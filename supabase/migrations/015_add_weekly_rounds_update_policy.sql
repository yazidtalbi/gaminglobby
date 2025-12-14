-- Add UPDATE policy for weekly_rounds table
-- Migration: 015_add_weekly_rounds_update_policy.sql

-- Allow authenticated users to update weekly_rounds
-- This is needed for founders to end votes (change status from 'open' to 'locked')
CREATE POLICY "Authenticated users can update weekly rounds"
  ON weekly_rounds FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

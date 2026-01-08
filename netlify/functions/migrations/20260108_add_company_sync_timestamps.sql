-- Migration: Add company sync timestamps for rotation
-- Run this in Supabase SQL Editor

-- Add per-platform sync timestamps to track when each company was last synced
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS last_synced_at_greenhouse TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_synced_at_lever TIMESTAMPTZ;

-- Index for efficient filtering of Greenhouse companies due for sync
CREATE INDEX IF NOT EXISTS idx_companies_greenhouse_sync 
  ON companies(last_synced_at_greenhouse ASC NULLS FIRST) 
  WHERE is_active = true AND greenhouse_board_token IS NOT NULL;

-- Index for efficient filtering of Lever companies due for sync
CREATE INDEX IF NOT EXISTS idx_companies_lever_sync 
  ON companies(last_synced_at_lever ASC NULLS FIRST) 
  WHERE is_active = true AND lever_slug IS NOT NULL;

COMMENT ON COLUMN companies.last_synced_at_greenhouse IS 'Timestamp of last successful Greenhouse job sync for this company';
COMMENT ON COLUMN companies.last_synced_at_lever IS 'Timestamp of last successful Lever job sync for this company';

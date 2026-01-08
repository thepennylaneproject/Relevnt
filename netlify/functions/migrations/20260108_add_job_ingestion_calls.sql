-- Migration: Add job_ingestion_calls table for 24h call signature tracking
-- Run this in Supabase SQL Editor

-- Track every API call signature to prevent duplicate calls within 24 hours
CREATE TABLE IF NOT EXISTS job_ingestion_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  signature TEXT NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result_count INT DEFAULT 0,
  UNIQUE (source, signature)
);

-- Index for fast lookups by source + signature + time
CREATE INDEX IF NOT EXISTS idx_ingestion_calls_source_sig_time 
  ON job_ingestion_calls(source, signature, called_at DESC);

-- Index for cleanup queries (delete old entries)
CREATE INDEX IF NOT EXISTS idx_ingestion_calls_called_at 
  ON job_ingestion_calls(called_at);

-- Cleanup function to remove entries older than 48 hours (keep some buffer)
-- Can be called periodically or via pg_cron
CREATE OR REPLACE FUNCTION cleanup_old_ingestion_calls()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM job_ingestion_calls 
  WHERE called_at < now() - interval '48 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE job_ingestion_calls IS 'Tracks API call signatures to prevent duplicate calls within 24 hours';

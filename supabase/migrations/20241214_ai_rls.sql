-- Hardening AI telemetry tables with RLS

-- Enable RLS (safe to re-run)
ALTER TABLE IF EXISTS ai_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role only" ON ai_invocations;
DROP POLICY IF EXISTS "Service role only" ON ai_cache;

-- Restrict access to service role only; app clients must use server-side functions
CREATE POLICY "Service role only" ON ai_invocations FOR ALL USING (false);
CREATE POLICY "Service role only" ON ai_cache FOR ALL USING (false);

-- Verification note
-- Migration 20241213_ai_routing_layer.sql created the tables; this migration enforces RLS.

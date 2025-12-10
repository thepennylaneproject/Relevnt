-- =============================================================================
-- V2 SCHEMA EXPANSION MIGRATION
-- =============================================================================
-- Phase C: Adds tables for job matches, auto-apply, relevance tuning,
-- skills tracking, learning recommendations, and coach-client relationships.
--
-- IMPORTANT: Does NOT modify existing jobs, job_ingestion_state, or auth tables.
-- =============================================================================

-- =============================================================================
-- 1. EXTEND JOB_MATCHES TABLE
-- =============================================================================
-- Add V2 fields to existing job_matches table

ALTER TABLE IF EXISTS job_matches
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES user_personas (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS match_factors JSONB,
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days';

-- Add index for persona-based queries
CREATE INDEX IF NOT EXISTS idx_job_matches_user_persona
  ON job_matches (user_id, persona_id);

-- =============================================================================
-- 2. AUTO APPLY RULES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS auto_apply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  persona_id UUID REFERENCES user_personas (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  match_score_threshold NUMERIC(5,2),
  max_applications_per_week INTEGER DEFAULT 5,
  exclude_companies TEXT[],
  include_only_companies TEXT[],
  require_all_keywords TEXT[],
  active_days TEXT[], -- ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_apply_rules_user
  ON auto_apply_rules (user_id);

CREATE INDEX IF NOT EXISTS idx_auto_apply_rules_persona
  ON auto_apply_rules (persona_id);

-- =============================================================================
-- 3. AUTO APPLY LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS auto_apply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rule_id UUID REFERENCES auto_apply_rules (id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs (id) ON DELETE SET NULL,
  status VARCHAR(50), -- 'submitted', 'failed', 'withdrawn'
  submission_url VARCHAR(2000),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auto_apply_logs_user_created
  ON auto_apply_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_apply_logs_rule
  ON auto_apply_logs (rule_id);

-- =============================================================================
-- 4. RELEVANCE TUNER SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS relevance_tuner_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  skill_weight NUMERIC(3,2) DEFAULT 0.3,
  salary_weight NUMERIC(3,2) DEFAULT 0.25,
  location_weight NUMERIC(3,2) DEFAULT 0.15,
  remote_weight NUMERIC(3,2) DEFAULT 0.2,
  industry_weight NUMERIC(3,2) DEFAULT 0.1,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relevance_tuner_settings_user
  ON relevance_tuner_settings (user_id);

-- =============================================================================
-- 5. USER SKILLS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  skill_name VARCHAR(255) NOT NULL,
  proficiency_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
  source VARCHAR(50), -- 'resume', 'input', 'inferred'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user
  ON user_skills (user_id);

-- =============================================================================
-- 6. LEARNING RECOMMENDATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  persona_id UUID REFERENCES user_personas (id) ON DELETE SET NULL,
  target_skill VARCHAR(255) NOT NULL,
  reason_text TEXT,
  recommended_courses JSONB, -- [{ name, url, provider, duration }]
  estimated_duration_weeks INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '30 days'
);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user
  ON learning_recommendations (user_id);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_persona
  ON learning_recommendations (persona_id);

-- =============================================================================
-- 7. COACH CLIENT RELATIONSHIPS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'ended'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coach_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_client_relationships_coach
  ON coach_client_relationships (coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_client_relationships_client
  ON coach_client_relationships (client_id);

-- =============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8a. job_matches RLS (already enabled, add persona-aware policies)
-- -----------------------------------------------------------------------------
-- Note: Assuming RLS is already enabled on job_matches

-- Drop existing policies if they exist (to recreate with updated logic)
DROP POLICY IF EXISTS "Users view their own job matches" ON job_matches;
DROP POLICY IF EXISTS "Users manage their own job matches" ON job_matches;

CREATE POLICY "Users view their own job matches" ON job_matches
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own job matches" ON job_matches
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own job matches" ON job_matches
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own job matches" ON job_matches
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8b. auto_apply_rules RLS
-- -----------------------------------------------------------------------------

ALTER TABLE auto_apply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own auto apply rules" ON auto_apply_rules
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own auto apply rules" ON auto_apply_rules
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own auto apply rules" ON auto_apply_rules
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own auto apply rules" ON auto_apply_rules
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8c. auto_apply_logs RLS
-- -----------------------------------------------------------------------------

ALTER TABLE auto_apply_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own auto apply logs" ON auto_apply_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own auto apply logs" ON auto_apply_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own auto apply logs" ON auto_apply_logs
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own auto apply logs" ON auto_apply_logs
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8d. relevance_tuner_settings RLS
-- -----------------------------------------------------------------------------

ALTER TABLE relevance_tuner_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own relevance tuner settings" ON relevance_tuner_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own relevance tuner settings" ON relevance_tuner_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own relevance tuner settings" ON relevance_tuner_settings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own relevance tuner settings" ON relevance_tuner_settings
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8e. user_skills RLS
-- -----------------------------------------------------------------------------

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own skills" ON user_skills
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own skills" ON user_skills
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own skills" ON user_skills
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own skills" ON user_skills
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8f. learning_recommendations RLS
-- -----------------------------------------------------------------------------

ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own learning recommendations" ON learning_recommendations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert their own learning recommendations" ON learning_recommendations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own learning recommendations" ON learning_recommendations
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete their own learning recommendations" ON learning_recommendations
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8g. coach_client_relationships RLS
-- -----------------------------------------------------------------------------
-- Special case: coaches and clients have different access patterns

ALTER TABLE coach_client_relationships ENABLE ROW LEVEL SECURITY;

-- Coaches can view relationships where they are the coach
CREATE POLICY "Coaches view their client relationships" ON coach_client_relationships
  FOR SELECT
  USING (coach_id = auth.uid());

-- Clients can view relationships where they are the client
CREATE POLICY "Clients view their coach relationships" ON coach_client_relationships
  FOR SELECT
  USING (client_id = auth.uid());

-- Only coaches can create relationships
CREATE POLICY "Coaches create client relationships" ON coach_client_relationships
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Only coaches can update relationships
CREATE POLICY "Coaches update client relationships" ON coach_client_relationships
  FOR UPDATE
  USING (coach_id = auth.uid());

-- Only coaches can delete relationships
CREATE POLICY "Coaches delete client relationships" ON coach_client_relationships
  FOR DELETE
  USING (coach_id = auth.uid());

-- =============================================================================
-- 9. UPDATED_AT TRIGGERS
-- =============================================================================
-- Uses the update_updated_at_column() function from the personas migration

-- Apply trigger to auto_apply_rules
DROP TRIGGER IF EXISTS update_auto_apply_rules_updated_at ON auto_apply_rules;
CREATE TRIGGER update_auto_apply_rules_updated_at
  BEFORE UPDATE ON auto_apply_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to relevance_tuner_settings
DROP TRIGGER IF EXISTS update_relevance_tuner_settings_updated_at ON relevance_tuner_settings;
CREATE TRIGGER update_relevance_tuner_settings_updated_at
  BEFORE UPDATE ON relevance_tuner_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to coach_client_relationships
DROP TRIGGER IF EXISTS update_coach_client_relationships_updated_at ON coach_client_relationships;
CREATE TRIGGER update_coach_client_relationships_updated_at
  BEFORE UPDATE ON coach_client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

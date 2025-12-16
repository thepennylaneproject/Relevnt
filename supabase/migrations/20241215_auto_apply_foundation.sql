-- =============================================================================
-- AUTO-APPLY FOUNDATION MIGRATION
-- =============================================================================
-- Creates the foundation for deterministic, auditable auto-apply workflows:
-- - auto_apply_queue: Jobs queued for processing with deduplication
-- - job_application_artifacts: Generated resume/cover letter variants
-- - Extends applications table with state machine columns
-- - Extends auto_apply_logs and auto_apply_rules with tracking columns
-- - Comprehensive RLS policies including coach-client access
-- =============================================================================

-- =============================================================================
-- 1. AUTO_APPLY_QUEUE TABLE
-- =============================================================================
-- Tracks jobs queued for auto-apply processing with deduplication

CREATE TABLE IF NOT EXISTS auto_apply_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  persona_id UUID REFERENCES user_personas (id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES auto_apply_rules (id) ON DELETE CASCADE,
  
  -- Queue status: 'pending', 'processing', 'completed', 'failed', 'cancelled'
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Priority for processing (higher = more urgent)
  priority INTEGER DEFAULT 0,
  
  -- Safe metadata (no secrets!)
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  
  -- Deduplication: prevent same job from being queued multiple times with same persona+rule
  CONSTRAINT unique_queue_entry UNIQUE (user_id, persona_id, job_id, rule_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_auto_apply_queue_user_status
  ON auto_apply_queue (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_apply_queue_scheduled
  ON auto_apply_queue (scheduled_for, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_auto_apply_queue_persona
  ON auto_apply_queue (persona_id);

-- =============================================================================
-- 2. JOB_APPLICATION_ARTIFACTS TABLE
-- =============================================================================
-- Stores generated resume/cover letter variants for applications

CREATE TABLE IF NOT EXISTS job_application_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  persona_id UUID REFERENCES user_personas (id) ON DELETE SET NULL,
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  
  -- Type of artifact: 'resume', 'cover_letter', 'questionnaire'
  artifact_type VARCHAR(50) NOT NULL,
  
  -- Content (could be JSON for structured data or text)
  content TEXT NOT NULL,
  
  -- Format: 'markdown', 'html', 'pdf_url', 'json'
  format VARCHAR(50) NOT NULL DEFAULT 'markdown',
  
  -- AI tracing
  ai_trace_id UUID,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate artifacts for same job+type
  CONSTRAINT unique_artifact_per_job UNIQUE (user_id, job_id, persona_id, artifact_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_application_artifacts_user_job
  ON job_application_artifacts (user_id, job_id, artifact_type);

CREATE INDEX IF NOT EXISTS idx_job_application_artifacts_persona
  ON job_application_artifacts (persona_id);

CREATE INDEX IF NOT EXISTS idx_job_application_artifacts_trace
  ON job_application_artifacts (ai_trace_id)
  WHERE ai_trace_id IS NOT NULL;

-- =============================================================================
-- 3. EXTEND APPLICATIONS TABLE
-- =============================================================================
-- Add state machine columns to existing applications table

-- Add new columns with defaults for backward compatibility
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS submission_method TEXT DEFAULT 'external_link',
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rule_id UUID REFERENCES auto_apply_rules (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES user_personas (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trace_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add CHECK constraint for valid status values
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'queued',
      'preparing',
      'ready_to_submit',
      'submitted',
      'failed',
      'paused',
      'requires_review',
      'withdrawn'
    )
  );

-- Add CHECK constraint for valid submission methods
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_submission_method_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_submission_method_check CHECK (
    submission_method IN ('external_link', 'supported_integration')
  );

-- Indexes for state machine queries
CREATE INDEX IF NOT EXISTS idx_applications_user_status
  ON applications (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_persona
  ON applications (persona_id)
  WHERE persona_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_rule
  ON applications (rule_id)
  WHERE rule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_trace
  ON applications (trace_id)
  WHERE trace_id IS NOT NULL;

-- Unique constraint to prevent duplicate applications for same job
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_job_user_unique
  ON applications (job_id, user_id)
  WHERE status != 'withdrawn';

-- =============================================================================
-- 4. EXTEND AUTO_APPLY_LOGS TABLE
-- =============================================================================
-- Add missing columns for comprehensive tracking

ALTER TABLE auto_apply_logs
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES user_personas (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trace_id UUID,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS artifacts JSONB;

-- Index for persona queries
CREATE INDEX IF NOT EXISTS idx_auto_apply_logs_persona
  ON auto_apply_logs (persona_id)
  WHERE persona_id IS NOT NULL;

-- Index for trace queries
CREATE INDEX IF NOT EXISTS idx_auto_apply_logs_trace
  ON auto_apply_logs (trace_id)
  WHERE trace_id IS NOT NULL;

-- =============================================================================
-- 5. EXTEND AUTO_APPLY_RULES TABLE
-- =============================================================================
-- Add state tracking columns

ALTER TABLE auto_apply_rules
  ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_applications INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_applications INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_applications INTEGER DEFAULT 0;

-- Index for active rules
CREATE INDEX IF NOT EXISTS idx_auto_apply_rules_enabled_lastrun
  ON auto_apply_rules (enabled, last_run_at)
  WHERE enabled = true;

-- =============================================================================
-- 6. ROW LEVEL SECURITY - AUTO_APPLY_QUEUE
-- =============================================================================

ALTER TABLE auto_apply_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own queue entries
CREATE POLICY "Users view own queue entries" ON auto_apply_queue
  FOR SELECT
  USING (user_id = auth.uid());

-- Coaches can view queue entries for active clients
CREATE POLICY "Coaches view client queue entries" ON auto_apply_queue
  FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM coach_client_relationships
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Users can insert their own queue entries
CREATE POLICY "Users insert own queue entries" ON auto_apply_queue
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own queue entries
CREATE POLICY "Users update own queue entries" ON auto_apply_queue
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own queue entries
CREATE POLICY "Users delete own queue entries" ON auto_apply_queue
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 7. ROW LEVEL SECURITY - JOB_APPLICATION_ARTIFACTS
-- =============================================================================

ALTER TABLE job_application_artifacts ENABLE ROW LEVEL SECURITY;

-- Users can view their own artifacts
CREATE POLICY "Users view own artifacts" ON job_application_artifacts
  FOR SELECT
  USING (user_id = auth.uid());

-- Coaches can view artifacts for active clients
CREATE POLICY "Coaches view client artifacts" ON job_application_artifacts
  FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM coach_client_relationships
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Users can insert their own artifacts
CREATE POLICY "Users insert own artifacts" ON job_application_artifacts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own artifacts
CREATE POLICY "Users update own artifacts" ON job_application_artifacts
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own artifacts
CREATE POLICY "Users delete own artifacts" ON job_application_artifacts
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 8. ROW LEVEL SECURITY - APPLICATIONS (UPDATE)
-- =============================================================================
-- Update existing policies to add coach access

-- Drop and recreate policies to add coach access
DROP POLICY IF EXISTS "Users can view their applications" ON applications;
DROP POLICY IF EXISTS "Users can insert their applications" ON applications;
DROP POLICY IF EXISTS "Users can update their applications" ON applications;
DROP POLICY IF EXISTS "Users can delete their applications" ON applications;

-- Users view own applications
CREATE POLICY "Users view own applications" ON applications
  FOR SELECT
  USING (user_id = auth.uid());

-- Coaches view client applications
CREATE POLICY "Coaches view client applications" ON applications
  FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM coach_client_relationships
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Users insert own applications
CREATE POLICY "Users insert own applications" ON applications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users update own applications
CREATE POLICY "Users update own applications" ON applications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users delete own applications
CREATE POLICY "Users delete own applications" ON applications
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 9. ROW LEVEL SECURITY - AUTO_APPLY_LOGS (UPDATE)
-- =============================================================================
-- Replace policies to add coach access

DROP POLICY IF EXISTS "Users view their own auto apply logs" ON auto_apply_logs;
DROP POLICY IF EXISTS "Users insert their own auto apply logs" ON auto_apply_logs;
DROP POLICY IF EXISTS "Users update their own auto apply logs" ON auto_apply_logs;
DROP POLICY IF EXISTS "Users delete their own auto apply logs" ON auto_apply_logs;

-- Users view own logs
CREATE POLICY "Users view own auto apply logs" ON auto_apply_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Coaches view client logs
CREATE POLICY "Coaches view client auto apply logs" ON auto_apply_logs
  FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM coach_client_relationships
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Users insert own logs
CREATE POLICY "Users insert own auto apply logs" ON auto_apply_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users update own logs
CREATE POLICY "Users update own auto apply logs" ON auto_apply_logs
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users delete own logs
CREATE POLICY "Users delete own auto apply logs" ON auto_apply_logs
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 10. ROW LEVEL SECURITY - AUTO_APPLY_RULES (UPDATE)
-- =============================================================================
-- Replace policies to add coach access

DROP POLICY IF EXISTS "Users view their own auto apply rules" ON auto_apply_rules;
DROP POLICY IF EXISTS "Users insert their own auto apply rules" ON auto_apply_rules;
DROP POLICY IF EXISTS "Users update their own auto apply rules" ON auto_apply_rules;
DROP POLICY IF EXISTS "Users delete their own auto apply rules" ON auto_apply_rules;

-- Users view own rules
CREATE POLICY "Users view own auto apply rules" ON auto_apply_rules
  FOR SELECT
  USING (user_id = auth.uid());

-- Coaches view client rules
CREATE POLICY "Coaches view client auto apply rules" ON auto_apply_rules
  FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM coach_client_relationships
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Users insert own rules
CREATE POLICY "Users insert own auto apply rules" ON auto_apply_rules
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users update own rules
CREATE POLICY "Users update own auto apply rules" ON auto_apply_rules
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users delete own rules
CREATE POLICY "Users delete own auto apply rules" ON auto_apply_rules
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

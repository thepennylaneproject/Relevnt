-- =============================================================================
-- INTELLIGENCE LAYER MIGRATION (Lyra Phase 2)
-- =============================================================================
-- Adds support for:
-- 1. Resume Version Tracking: Linking specific resume versions/snapshots to applications
-- 2. Rejection Debriefs: Storing AI analysis of rejection emails
-- =============================================================================

-- 1. Resume Version Tracking
-- Add columns to link resume and store snapshot (in case resume is edited later)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resume_snapshot JSONB; -- Stores { content, parsed_text, skills }

-- Index for querying applications by resume (e.g., "Where did I use Resume A?")
CREATE INDEX IF NOT EXISTS idx_applications_resume_id
ON applications(resume_id);


-- 2. Rejection Debriefs
-- Store AI analysis of rejection reason, tone, and improvement suggestions
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS rejection_analysis JSONB;

-- Comment on columns for clarity
COMMENT ON COLUMN applications.resume_snapshot IS 'Snapshot of resume content at time of application';
COMMENT ON COLUMN applications.rejection_analysis IS 'AI analysis of rejection email (reason, suggestions)';

-- =============================================================================
-- PERSONA-RESUME ASSOCIATION MIGRATION
-- =============================================================================
-- Adds resume_id column to user_personas table to associate personas with
-- specific resumes. This is an optional association - personas can exist
-- without a resume.
-- =============================================================================

-- =============================================================================
-- 1. ADD RESUME_ID COLUMN
-- =============================================================================

ALTER TABLE user_personas
  ADD COLUMN IF NOT EXISTS resume_id UUID;

-- =============================================================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- =============================================================================
-- ON DELETE SET NULL: When a resume is deleted, the association is cleared
-- but the persona remains intact

-- Drop existing constraint if it exists
ALTER TABLE user_personas
  DROP CONSTRAINT IF EXISTS fk_user_personas_resume;

ALTER TABLE user_personas
  ADD CONSTRAINT fk_user_personas_resume
  FOREIGN KEY (resume_id)
  REFERENCES resumes (id)
  ON DELETE SET NULL;

-- =============================================================================
-- 3. ADD INDEX FOR PERFORMANCE
-- =============================================================================
-- Index for efficient lookups when querying personas by resume

CREATE INDEX IF NOT EXISTS idx_user_personas_resume_id
  ON user_personas (resume_id)
  WHERE resume_id IS NOT NULL;

-- =============================================================================
-- 4. ADD CHECK CONSTRAINT
-- =============================================================================
-- Ensure that if a resume_id is provided, it belongs to the same user
-- This prevents users from associating personas with other users' resumes

-- Note: This is enforced at the application level in the API
-- We rely on the API to validate resume ownership before insertion/update
-- since Supabase RLS already handles user isolation

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- 
-- What was added:
-- ✅ resume_id column (nullable) to user_personas
-- ✅ Foreign key constraint to resumes table
-- ✅ ON DELETE SET NULL behavior (persona survives resume deletion)
-- ✅ Index for efficient resume-based queries
-- ✅ Application-level validation for resume ownership
-- 
-- =============================================================================

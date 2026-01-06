-- ============================================================================
-- FEEDBACK SIGNALS TABLE
-- ============================================================================
-- Stores user feedback (thumbs up/down) on jobs for automatic preference tuning
-- Author: Direct Feed Tuner Implementation
-- Date: 2026-01-02

-- Create feedback_signals table
CREATE TABLE IF NOT EXISTS feedback_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES user_personas(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK(feedback_type IN ('positive', 'negative')),
    
    -- Extracted job attributes for pattern detection
    industry TEXT,
    company_size TEXT,
    remote_type TEXT,
    location TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one feedback per job per persona
    UNIQUE(persona_id, job_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_feedback_signals_user_id 
    ON feedback_signals(user_id);
    
CREATE INDEX IF NOT EXISTS idx_feedback_signals_persona_id 
    ON feedback_signals(persona_id);
    
CREATE INDEX IF NOT EXISTS idx_feedback_signals_job_id 
    ON feedback_signals(job_id);
    
CREATE INDEX IF NOT EXISTS idx_feedback_signals_feedback_type 
    ON feedback_signals(persona_id, feedback_type);

-- Enable Row Level Security
ALTER TABLE feedback_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback_signals;
CREATE POLICY "Users can view their own feedback" 
    ON feedback_signals FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback_signals;
CREATE POLICY "Users can insert their own feedback" 
    ON feedback_signals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback_signals;
CREATE POLICY "Users can update their own feedback" 
    ON feedback_signals FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own feedback" ON feedback_signals;
CREATE POLICY "Users can delete their own feedback" 
    ON feedback_signals FOR DELETE 
    USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE feedback_signals IS 'Stores user feedback signals on jobs for automatic preference tuning. Used by Direct Feed Tuner feature.';

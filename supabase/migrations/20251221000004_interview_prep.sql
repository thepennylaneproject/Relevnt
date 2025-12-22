-- Migration: 20251221000004_interview_prep.sql
-- Description: Create interview_practice_sessions table to track practice sessions and AI feedback.

CREATE TABLE IF NOT EXISTS public.interview_practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interview_prep_id UUID REFERENCES public.interview_prep(id) ON DELETE SET NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    
    -- Session status: 'active', 'completed', 'cancelled'
    status TEXT NOT NULL DEFAULT 'active',
    
    -- Questions generated for this session
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- User's responses and AI feedback
    -- Structure: [{ question: string, response: string, feedback: string, score: number, timestamp: string }]
    practice_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Overall session feedback
    overall_feedback JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_interview_practice_sessions_user ON public.interview_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_practice_sessions_prep ON public.interview_practice_sessions(interview_prep_id);
CREATE INDEX IF NOT EXISTS idx_interview_practice_sessions_application ON public.interview_practice_sessions(application_id);

-- Enable RLS
ALTER TABLE public.interview_practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own interview practice sessions"
    ON public.interview_practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview practice sessions"
    ON public.interview_practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview practice sessions"
    ON public.interview_practice_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_interview_practice_sessions_updated_at
    BEFORE UPDATE ON public.interview_practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

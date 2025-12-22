-- =============================================================================
-- JOB INTERACTION PATTERNS
-- =============================================================================
-- Track job interactions for pattern analysis and user behavior insights
-- Part of Lyra Intelligence Layer - Phase 1.1
-- =============================================================================

-- Track individual job interactions
CREATE TABLE IF NOT EXISTS public.job_interaction_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'save', 'dismiss', 'apply', 'unsave')),
    match_score NUMERIC,
    match_factors JSONB,
    persona_id UUID REFERENCES public.user_personas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_interactions_user_id 
    ON public.job_interaction_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_job_interactions_type 
    ON public.job_interaction_patterns(interaction_type);
CREATE INDEX IF NOT EXISTS idx_job_interactions_created 
    ON public.job_interaction_patterns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_interactions_user_type 
    ON public.job_interaction_patterns(user_id, interaction_type);

-- Aggregated pattern insights (computed periodically)
CREATE TABLE IF NOT EXISTS public.user_pattern_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'dismiss_by_location', 'dismiss_by_salary', 'save_by_remote', etc.
    insight_title TEXT NOT NULL,
    insight_message TEXT NOT NULL,
    insight_data JSONB NOT NULL DEFAULT '{}',
    priority INT DEFAULT 1, -- 1=low, 2=medium, 3=high
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_pattern_insights_user 
    ON public.user_pattern_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_active 
    ON public.user_pattern_insights(user_id, is_dismissed, expires_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.job_interaction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pattern_insights ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own interactions
CREATE POLICY "Users can view their own interactions"
    ON public.job_interaction_patterns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
    ON public.job_interaction_patterns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view and dismiss their own insights
CREATE POLICY "Users can view their own insights"
    ON public.user_pattern_insights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
    ON public.user_pattern_insights FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin/system can insert insights (via service role)
CREATE POLICY "Service can insert insights"
    ON public.user_pattern_insights FOR INSERT
    WITH CHECK (true);

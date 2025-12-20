-- Migration: Add portfolio_analyses table
CREATE TABLE IF NOT EXISTS public.portfolio_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_url TEXT NOT NULL,
    analysis_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_user_id ON public.portfolio_analyses(user_id);

-- Enable RLS
ALTER TABLE public.portfolio_analyses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own portfolio analyses" 
ON public.portfolio_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio analyses" 
ON public.portfolio_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio analyses" 
ON public.portfolio_analyses FOR UPDATE 
USING (auth.uid() = user_id);

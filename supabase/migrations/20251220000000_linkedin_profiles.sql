-- Migration: Add linkedin_profiles table
CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    linkedin_url TEXT NOT NULL,
    profile_data JSONB NOT NULL,
    analysis_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_user_id ON public.linkedin_profiles(user_id);

-- Enable RLS
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own linkedin profiles" 
ON public.linkedin_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own linkedin profiles" 
ON public.linkedin_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own linkedin profiles" 
ON public.linkedin_profiles FOR UPDATE 
USING (auth.uid() = user_id);

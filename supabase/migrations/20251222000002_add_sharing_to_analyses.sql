-- Migration: Add sharing support to profile and portfolio analyses
-- Supports Action 5: Share Audit Viral Hook

-- ----------------------------------------------------------------------------
-- LinkedIn Profiles Sharing
-- ----------------------------------------------------------------------------
ALTER TABLE public.linkedin_profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Create index for faster lookups by share_token
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_share_token ON public.linkedin_profiles(share_token);

-- Update RLS for public access
CREATE POLICY "Anyone can view shared linkedin profiles" 
ON public.linkedin_profiles FOR SELECT 
USING (is_public = TRUE);

-- ----------------------------------------------------------------------------
-- Portfolio Analyses Sharing
-- ----------------------------------------------------------------------------
ALTER TABLE public.portfolio_analyses 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Create index for faster lookups by share_token
CREATE INDEX IF NOT EXISTS idx_portfolio_analyses_share_token ON public.portfolio_analyses(share_token);

-- Update RLS for public access
CREATE POLICY "Anyone can view shared portfolio analyses" 
ON public.portfolio_analyses FOR SELECT 
USING (is_public = TRUE);

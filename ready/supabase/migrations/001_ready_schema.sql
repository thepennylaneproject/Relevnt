-- Migration: Create Ready Database Schema
-- Description: Initialize tables for Ready project with RLS policies.

-- ----------------------------------------------------------------------------
-- Core User Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ready_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  headline TEXT,
  goal TEXT,
  focus_areas TEXT[],
  readiness_score INTEGER DEFAULT 0,
  last_practice_date TIMESTAMPTZ,
  assessments_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Interview Practice Suite
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  company TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interview_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_prep_id UUID REFERENCES public.interview_prep(id) ON DELETE SET NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  practice_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  overall_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_url TEXT NOT NULL,
  profile_data JSONB,
  analysis_results JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  share_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, linkedin_url)
);

-- Ensure columns exist if table was already created
ALTER TABLE public.linkedin_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.linkedin_profiles ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.portfolio_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_url TEXT NOT NULL,
  analysis_results JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  share_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portfolio_url)
);

-- Ensure columns exist if table was already created
ALTER TABLE public.portfolio_analyses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.portfolio_analyses ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();
CREATE TABLE IF NOT EXISTS public.skill_gap_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT,
  current_skills TEXT[],
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths TEXT[],
  action_plan TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, addressed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_gap_id UUID REFERENCES public.skill_gap_analyses(id) ON DELETE SET NULL,
  skill TEXT NOT NULL,
  resource_url TEXT,
  resource_name TEXT,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Narrative & Negotiation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_story TEXT,
  pivot_explanation TEXT,
  value_proposition TEXT,
  future_vision TEXT,
  voice_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.negotiation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  company TEXT,
  offer_details JSONB,
  target_range JSONB,
  strategy TEXT,
  scripts TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Readiness Snapshots
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.readiness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER,
  practice_score INTEGER,
  assessment_score INTEGER,
  skills_score INTEGER,
  narrative_score INTEGER,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Triggers and Functions
-- ----------------------------------------------------------------------------

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_ready_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.ready_profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'firstName', '') || ' ' || COALESCE(new.raw_user_meta_data->>'lastName', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_ready_user();

-- ----------------------------------------------------------------------------
-- Triggers for updated_at
-- ----------------------------------------------------------------------------
-- We assume public.handle_updated_at() exists from Relevnt schema

DROP TRIGGER IF EXISTS set_ready_profiles_updated_at ON public.ready_profiles;
CREATE TRIGGER set_ready_profiles_updated_at BEFORE UPDATE ON public.ready_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_interview_prep_updated_at ON public.interview_prep;
CREATE TRIGGER set_interview_prep_updated_at BEFORE UPDATE ON public.interview_prep FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_interview_practice_sessions_updated_at ON public.interview_practice_sessions;
CREATE TRIGGER set_interview_practice_sessions_updated_at BEFORE UPDATE ON public.interview_practice_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_linkedin_profiles_updated_at ON public.linkedin_profiles;
CREATE TRIGGER set_linkedin_profiles_updated_at BEFORE UPDATE ON public.linkedin_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_portfolio_analyses_updated_at ON public.portfolio_analyses;
CREATE TRIGGER set_portfolio_analyses_updated_at BEFORE UPDATE ON public.portfolio_analyses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_skill_gap_analyses_updated_at ON public.skill_gap_analyses;
CREATE TRIGGER set_skill_gap_analyses_updated_at BEFORE UPDATE ON public.skill_gap_analyses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_career_narratives_updated_at ON public.career_narratives;
CREATE TRIGGER set_career_narratives_updated_at BEFORE UPDATE ON public.career_narratives FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_negotiation_sessions_updated_at ON public.negotiation_sessions;
CREATE TRIGGER set_negotiation_sessions_updated_at BEFORE UPDATE ON public.negotiation_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------
ALTER TABLE ready_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------

-- Helper macro for standard "Users can X their own data" policies
-- ready_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON ready_profiles;
CREATE POLICY "Users can view their own profile" ON ready_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON ready_profiles;
CREATE POLICY "Users can update their own profile" ON ready_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON ready_profiles;
CREATE POLICY "Users can insert their own profile" ON ready_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- interview_prep
DROP POLICY IF EXISTS "Users can manage their own interview prep" ON interview_prep;
CREATE POLICY "Users can manage their own interview prep" ON interview_prep FOR ALL USING (auth.uid() = user_id);

-- interview_practice_sessions
DROP POLICY IF EXISTS "Users can manage their own practice sessions" ON interview_practice_sessions;
CREATE POLICY "Users can manage their own practice sessions" ON interview_practice_sessions FOR ALL USING (auth.uid() = user_id);

-- linkedin_profiles
DROP POLICY IF EXISTS "Users can manage their own linkedin profiles" ON linkedin_profiles;
CREATE POLICY "Users can manage their own linkedin profiles" ON linkedin_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view shared linkedin profiles" ON linkedin_profiles;
CREATE POLICY "Anyone can view shared linkedin profiles" ON linkedin_profiles FOR SELECT USING (is_public = TRUE);

-- portfolio_analyses
DROP POLICY IF EXISTS "Users can manage their own portfolio analyses" ON portfolio_analyses;
CREATE POLICY "Users can manage their own portfolio analyses" ON portfolio_analyses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view shared portfolio analyses" ON portfolio_analyses;
CREATE POLICY "Anyone can view shared portfolio analyses" ON portfolio_analyses FOR SELECT USING (is_public = TRUE);

-- skill_gap_analyses
DROP POLICY IF EXISTS "Users can manage their own skill gap analyses" ON skill_gap_analyses;
CREATE POLICY "Users can manage their own skill gap analyses" ON skill_gap_analyses FOR ALL USING (auth.uid() = user_id);

-- learning_progress
DROP POLICY IF EXISTS "Users can manage their own learning progress" ON learning_progress;
CREATE POLICY "Users can manage their own learning progress" ON learning_progress FOR ALL USING (auth.uid() = user_id);

-- career_narratives
DROP POLICY IF EXISTS "Users can manage their own career narratives" ON career_narratives;
CREATE POLICY "Users can manage their own career narratives" ON career_narratives FOR ALL USING (auth.uid() = user_id);

-- negotiation_sessions
DROP POLICY IF EXISTS "Users can manage their own negotiation sessions" ON negotiation_sessions;
CREATE POLICY "Users can manage their own negotiation sessions" ON negotiation_sessions FOR ALL USING (auth.uid() = user_id);

-- readiness_snapshots
DROP POLICY IF EXISTS "Users can view their own readiness snapshots" ON readiness_snapshots;
CREATE POLICY "Users can view their own readiness snapshots" ON readiness_snapshots FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own readiness snapshots" ON readiness_snapshots;
CREATE POLICY "Users can insert their own readiness snapshots" ON readiness_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

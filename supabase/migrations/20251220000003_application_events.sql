-- Add application_events table
CREATE TABLE IF NOT EXISTS public.application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'status_change', 'note', 'interview_scheduled', 'follow_up'
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'::jsonb
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON public.application_events(application_id);

-- RLS
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own application events"
    ON public.application_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own application events"
    ON public.application_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

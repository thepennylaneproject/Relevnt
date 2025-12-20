-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'job_alert'
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Create alert history to prevent duplicates
CREATE TABLE IF NOT EXISTS public.user_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to prevent double-alerting for the same job and user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_job_alert 
    ON public.user_alert_history(user_id, job_id, alert_type);

-- RLS for history (mostly internal/admin logic but keeping it safe)
ALTER TABLE public.user_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert history"
    ON public.user_alert_history FOR SELECT
    USING (auth.uid() = user_id);

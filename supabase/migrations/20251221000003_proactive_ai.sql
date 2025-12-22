-- Add metadata to notifications for richer UI
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add score and meta to alert history for "highest match" tracking
ALTER TABLE public.user_alert_history 
ADD COLUMN IF NOT EXISTS score NUMERIC,
ADD COLUMN IF NOT EXISTS meta JSONB;

-- Create index for faster max(score) queries
CREATE INDEX IF NOT EXISTS idx_alert_history_user_score 
ON public.user_alert_history(user_id, score DESC);

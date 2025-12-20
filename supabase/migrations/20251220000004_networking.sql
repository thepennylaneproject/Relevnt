-- Create networking_contacts table
CREATE TABLE IF NOT EXISTS public.networking_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    linkedin_url TEXT,
    email TEXT,
    status TEXT DEFAULT 'identified', -- 'identified', 'requested', 'connected', 'replied', 'met'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching contacts
CREATE INDEX IF NOT EXISTS idx_networking_contacts_user_id ON public.networking_contacts(user_id);

-- Create outreach_logs table
CREATE TABLE IF NOT EXISTS public.outreach_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.networking_contacts(id) ON DELETE CASCADE,
    method TEXT DEFAULT 'linkedin', -- 'linkedin', 'email', 'phone', 'other'
    message_content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    response_received BOOLEAN DEFAULT false
);

-- Create outreach_templates table
CREATE TABLE IF NOT EXISTS public.outreach_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general'
);

-- RLS
ALTER TABLE public.networking_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own networking contacts"
    ON public.networking_contacts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own outreach logs"
    ON public.outreach_logs FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own outreach templates"
    ON public.outreach_templates FOR ALL
    USING (auth.uid() = user_id);

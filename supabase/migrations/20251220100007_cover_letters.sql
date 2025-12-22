-- migration to add cover letters table
create table if not exists cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  application_id uuid references applications on delete set null,
  resume_id uuid references resumes on delete set null,
  title text not null,
  content text not null,
  job_description text,
  company_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table cover_letters enable row level security;

create policy "Users can manage their own cover letters"
  on cover_letters for all
  using (auth.uid() = user_id);

-- Indices
create index cover_letters_user_id_idx on cover_letters(user_id);
create index cover_letters_application_id_idx on cover_letters(application_id);

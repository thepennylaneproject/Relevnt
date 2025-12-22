-- migration for wellness check-ins
create table if not exists wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  mood_score integer check (mood_score between 1 and 10),
  note text,
  created_at timestamptz default now()
);

-- RLS
alter table wellness_checkins enable row level security;

create policy "Users can view their own check-ins"
  on wellness_checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own check-ins"
  on wellness_checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own check-ins"
  on wellness_checkins for update
  using (auth.uid() = user_id);

-- Indices
create index wellness_checkins_user_id_idx on wellness_checkins(user_id);
create index wellness_checkins_created_at_idx on wellness_checkins(created_at);

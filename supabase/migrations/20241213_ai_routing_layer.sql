-- AI routing telemetry + cache tables

create table if not exists ai_invocations (
  id bigserial primary key,
  user_id uuid null references auth.users(id) on delete set null,
  task_name text not null,
  tier text not null,
  provider text not null,
  model text not null,
  quality text not null,
  reason text null,
  input_size integer,
  output_size integer,
  latency_ms integer,
  cost_estimate numeric,
  cache_hit boolean default false,
  success boolean default true,
  error_code text null,
  error_message text null,
  trace_id text null,
  created_at timestamptz default now()
);

create index if not exists ai_invocations_created_idx on ai_invocations (created_at desc);
create index if not exists ai_invocations_user_day_idx on ai_invocations (user_id, created_at desc);

create table if not exists ai_cache (
  cache_key text primary key,
  task_name text not null,
  user_tier text not null,
  quality text not null,
  expires_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create index if not exists ai_cache_expires_idx on ai_cache (expires_at);

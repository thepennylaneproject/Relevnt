-- migration to add career priorities to profiles
alter table profiles
add column if not exists career_priorities jsonb default '{"salary": 5, "work_life_balance": 5, "career_growth": 5, "team_culture": 5, "impact": 5}'::jsonb;

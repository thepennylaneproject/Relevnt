-- migration to add career narrative fields to profiles
alter table profiles 
add column if not exists career_narrative_origin text,
add column if not exists career_narrative_pivot text,
add column if not exists career_narrative_value text,
add column if not exists career_narrative_future text,
add column if not exists last_narrative_generated_at timestamptz;

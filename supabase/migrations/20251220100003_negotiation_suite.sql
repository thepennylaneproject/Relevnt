-- migration to add salary negotiation and offer fields to applications
alter table applications
add column if not exists offer_details jsonb,
add column if not exists negotiation_strategy text,
add column if not exists negotiation_notes text,
add column if not exists target_salary_min integer,
add column if not exists target_salary_max integer;

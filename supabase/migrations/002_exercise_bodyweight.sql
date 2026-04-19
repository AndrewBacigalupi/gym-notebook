-- Bodyweight exercises: no external load; logs store weight = 0 for PR comparison (avg reps).

alter table public.exercises
  add column if not exists is_bodyweight boolean not null default false;

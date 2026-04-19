-- Gym Notebook — initial schema + RLS
-- Run in Supabase SQL Editor or via CLI migrations.

-- Profiles mirror auth.users for app-level queries
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Exercises
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists exercises_user_id_idx on public.exercises (user_id);

alter table public.exercises enable row level security;

create policy "exercises_all_own"
  on public.exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Workouts
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_id_idx on public.workouts (user_id);

alter table public.workouts enable row level security;

create policy "workouts_all_own"
  on public.workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Workout exercises (ordering)
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  order_index int not null,
  unique (workout_id, order_index),
  unique (workout_id, exercise_id)
);

create index if not exists workout_exercises_workout_id_idx on public.workout_exercises (workout_id);

alter table public.workout_exercises enable row level security;

create policy "workout_exercises_select"
  on public.workout_exercises for select
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

create policy "workout_exercises_insert"
  on public.workout_exercises for insert
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
    and exists (
      select 1 from public.exercises e
      where e.id = workout_exercises.exercise_id and e.user_id = auth.uid()
    )
  );

create policy "workout_exercises_update"
  on public.workout_exercises for update
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

create policy "workout_exercises_delete"
  on public.workout_exercises for delete
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

-- Sessions
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  performed_at timestamptz not null default now(),
  notes text
);

create index if not exists workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index if not exists workout_sessions_performed_at_idx on public.workout_sessions (performed_at desc);

alter table public.workout_sessions enable row level security;

create policy "workout_sessions_all_own"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-exercise performance in a session
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  weight numeric not null check (weight >= 0),
  pr_score numeric,
  is_personal_record boolean not null default false
);

create index if not exists exercise_logs_session_id_idx on public.exercise_logs (session_id);
create index if not exists exercise_logs_exercise_id_idx on public.exercise_logs (exercise_id);

alter table public.exercise_logs enable row level security;

create policy "exercise_logs_select"
  on public.exercise_logs for select
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

create policy "exercise_logs_insert"
  on public.exercise_logs for insert
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_logs.exercise_id and e.user_id = auth.uid()
    )
  );

create policy "exercise_logs_update"
  on public.exercise_logs for update
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

create policy "exercise_logs_delete"
  on public.exercise_logs for delete
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

-- Individual sets
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  exercise_log_id uuid not null references public.exercise_logs (id) on delete cascade,
  set_number int not null check (set_number > 0),
  reps int not null check (reps >= 0),
  unique (exercise_log_id, set_number)
);

create index if not exists set_logs_exercise_log_id_idx on public.set_logs (exercise_log_id);

alter table public.set_logs enable row level security;

create policy "set_logs_select"
  on public.set_logs for select
  using (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

create policy "set_logs_insert"
  on public.set_logs for insert
  with check (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

create policy "set_logs_update"
  on public.set_logs for update
  using (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

create policy "set_logs_delete"
  on public.set_logs for delete
  using (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

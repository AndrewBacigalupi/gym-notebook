# Gym Notebook

Personal workout logging with Supabase Auth, PostgreSQL, and a Next.js (App Router) frontend.

## Setup

1. **Dependencies**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run `supabase/migrations/001_initial.sql`.
   - Authentication → URL configuration: add your local URL (e.g. `http://localhost:3000`) to redirect URLs if you use email confirmation.
   - Copy **Project URL** and **anon public** key.

3. **Environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project layout

- `src/app` — routes: marketing home, `/login`, `/signup`, `/dashboard`, `/exercises/new`, `/workouts/new`, `/workouts/[id]/start`, `/progress`, `/progress/exercises/[id]`.
- `src/app/actions` — server actions (auth, exercises, workouts, session logging, PRs).
- `src/lib/pr.ts` — PR score and tie-break rules (`weight × avg reps`, then weight, then avg reps).
- `src/lib/supabase` — browser and server Supabase clients; `src/proxy.ts` (Next.js 16) refreshes the auth cookie.
- `supabase/migrations` — schema, RLS, and `profiles` trigger for new users.

## PR rule

For each exercise log: **score = weight × average reps across sets**. A set is a new PR if it strictly beats the best prior score under that ordering (including tie-breaks).

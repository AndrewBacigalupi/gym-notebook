import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select(
      `
      id,
      performed_at,
      notes,
      workouts ( name )
    `
    )
    .eq("user_id", user.id)
    .order("performed_at", { ascending: false })
    .limit(6);

  const { data: prRowsRaw } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      pr_score,
      weight,
      exercises ( name ),
      workout_sessions!inner ( performed_at, user_id )
    `
    )
    .eq("is_personal_record", true);

  type PRRow = {
    id: string;
    pr_score: number | null;
    workout_sessions: { performed_at: string; user_id: string };
  };

  const recentPRs = (prRowsRaw ?? [])
    .map((r) => r as unknown as PRRow)
    .filter((r) => r.workout_sessions.user_id === user.id)
    .sort(
      (a, b) =>
        new Date(b.workout_sessions.performed_at).getTime() -
        new Date(a.workout_sessions.performed_at).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-zinc-600">Your workouts and recent training.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/exercises/new"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Add exercise
          </Link>
          <Link
            href="/workouts/new"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Create workout
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">Your workouts</h2>
          <Link href="/workouts/new" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            New
          </Link>
        </div>
        {workouts && workouts.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-100">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">{w.name}</p>
                  <p className="text-sm text-zinc-500">
                    Created {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/workouts/${w.id}/start`}
                  className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Start workout
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-600">
            No workouts yet.{" "}
            <Link href="/workouts/new" className="font-medium text-zinc-900 underline">
              Create your first
            </Link>
            .
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Recent sessions</h2>
          {recentSessions && recentSessions.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {recentSessions.map((s) => {
                const w = s.workouts as unknown as { name: string } | null;
                return (
                  <li key={s.id} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-zinc-900">{w?.name ?? "Workout"}</p>
                      <p className="text-zinc-500">
                        {new Date(s.performed_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">Complete a workout to see history here.</p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Recent PRs</h2>
          {recentPRs.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {recentPRs.map((row) => {
                const ex = (row as unknown as { exercises?: { name: string } | null })
                  .exercises;
                return (
                  <li key={row.id} className="text-sm">
                    <p className="font-medium text-zinc-900">{ex?.name ?? "Exercise"}</p>
                    <p className="text-zinc-600">
                      Score {row.pr_score != null ? row.pr_score.toFixed(1) : "—"} ·{" "}
                      {new Date(row.workout_sessions.performed_at).toLocaleDateString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              New PRs appear here when you beat your best on an exercise.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Progress
        </h2>
        <p className="mt-2 text-zinc-700">
          Review sets, weights, and PR progression for any exercise.
        </p>
        <Link
          href="/progress"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          Open progress history
        </Link>
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseFullHistory } from "@/lib/queries/exercise-insights";
import { createClient } from "@/lib/supabase/server";
import { formatPRDisplay } from "@/lib/pr";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name, notes, is_bodyweight")
    .eq("id", exerciseId)
    .eq("user_id", user.id)
    .single();

  if (!exercise) notFound();

  const history = await getExerciseFullHistory(user.id, exerciseId);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/progress" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← All exercises
        </Link>
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{exercise.name}</h1>
          {exercise.is_bodyweight ? (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              Bodyweight
            </span>
          ) : null}
        </div>
        {exercise.notes ? <p className="mt-2 text-sm text-zinc-600">{exercise.notes}</p> : null}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {history.length === 0 ? (
          <p className="p-6 text-sm text-zinc-600">No sessions logged for this exercise yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {history.map((row) => (
              <li key={row.id} className="px-6 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {new Date(row.performedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-zinc-600 tabular-nums">
                      {formatPRDisplay(row.weight, row.reps, exercise.is_bodyweight === true)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {row.isPR ? (
                      <p className="font-medium text-amber-800">PR session</p>
                    ) : (
                      <p className="text-zinc-400">—</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

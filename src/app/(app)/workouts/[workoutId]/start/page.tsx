import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkoutRunner } from "@/components/workout-runner";
import { getExerciseInsightsForUser } from "@/lib/queries/exercise-insights";
import { createClient } from "@/lib/supabase/server";

export default async function StartWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, name, user_id")
    .eq("id", workoutId)
    .single();

  if (!workout || workout.user_id !== user.id) notFound();

  const { data: we } = await supabase
    .from("workout_exercises")
    .select(
      `
      order_index,
      exercises ( id, name, is_bodyweight )
    `
    )
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true });

  const ordered =
    we
      ?.map((row) => {
        const ex = row.exercises as unknown as {
          id: string;
          name: string;
          is_bodyweight: boolean | null;
        } | null;
        if (!ex) return null;
        return { id: ex.id, name: ex.name, isBodyweight: ex.is_bodyweight === true, order_index: row.order_index };
      })
      .filter(
        (x): x is { id: string; name: string; isBodyweight: boolean; order_index: number } =>
          x !== null
      ) ?? [];

  const exercises = await Promise.all(
    ordered.map(async (ex) => {
      const insights = await getExerciseInsightsForUser(user.id, ex.id);
      return {
        id: ex.id,
        name: ex.name,
        isBodyweight: ex.isBodyweight,
        previousBest: insights.previousBest,
        lastPerformance: insights.lastPerformance,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">Start workout</h1>
        <p className="mt-1 text-zinc-600">Move through each exercise in order. Every set counts.</p>
      </div>

      <WorkoutRunner workoutId={workout.id} workoutName={workout.name} exercises={exercises} />
    </div>
  );
}

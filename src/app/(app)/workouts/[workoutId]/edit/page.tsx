import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkoutForm } from "@/components/workout-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditWorkoutPage({
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
    .select("exercise_id, order_index")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true });

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, is_bodyweight")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">Edit workout</h1>
        <p className="mt-1 text-zinc-600">Update the name or exercise sequence for this template.</p>
      </div>

      <WorkoutForm
        exercises={exercises ?? []}
        initialData={{
          id: workout.id,
          name: workout.name,
          exerciseIds: we?.map((row) => row.exercise_id) ?? [],
        }}
      />
    </div>
  );
}

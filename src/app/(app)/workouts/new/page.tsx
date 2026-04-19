import Link from "next/link";
import { WorkoutForm } from "@/components/workout-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, is_bodyweight")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">New workout</h1>
        <p className="mt-1 text-zinc-600">Name the session and arrange your exercises.</p>
      </div>

      {!exercises?.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          You need at least one exercise first.{" "}
          <Link href="/exercises/new" className="font-medium underline">
            Add an exercise
          </Link>
          .
        </div>
      ) : (
        <WorkoutForm exercises={exercises} />
      )}
    </div>
  );
}

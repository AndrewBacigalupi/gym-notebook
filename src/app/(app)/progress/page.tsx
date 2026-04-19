import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">Progress</h1>
        <p className="mt-1 text-zinc-600">Open an exercise to see full history and PR progression.</p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {exercises && exercises.length > 0 ? (
          <ul className="divide-y divide-zinc-100">
            {exercises.map((ex) => (
              <li key={ex.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/progress/exercises/${ex.id}`}
                  className="flex items-center justify-between gap-4 text-zinc-900 hover:text-zinc-700"
                >
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-sm text-zinc-500">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">
            No exercises yet.{" "}
            <Link href="/exercises/new" className="font-medium text-zinc-900 underline">
              Create one
            </Link>{" "}
            to start tracking.
          </p>
        )}
      </section>
    </div>
  );
}

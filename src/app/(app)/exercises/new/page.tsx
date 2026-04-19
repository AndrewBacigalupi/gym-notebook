import Link from "next/link";
import { createExercise } from "@/app/actions/exercises";

export default function NewExercisePage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">New exercise</h1>
        <p className="mt-1 text-zinc-600">Add a movement you want to track.</p>
      </div>

      <form action={createExercise} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Bench Press"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Notes <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Cues, equipment, tempo…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Save exercise
        </button>
      </form>
    </div>
  );
}

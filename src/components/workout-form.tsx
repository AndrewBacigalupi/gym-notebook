"use client";

import { useState, useTransition } from "react";
import { createWorkout } from "@/app/actions/workouts";

export type ExerciseOption = { id: string; name: string };

export function WorkoutForm({ exercises }: { exercises: ExerciseOption[] }) {
  const [name, setName] = useState("");
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addExercise(id: string) {
    if (orderedIds.includes(id)) return;
    setOrderedIds((prev) => [...prev, id]);
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= orderedIds.length) return;
    setOrderedIds((prev) => {
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[next];
      copy[next] = tmp;
      return copy;
    });
  }

  function removeAt(index: number) {
    setOrderedIds((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createWorkout({ name, exerciseIdsInOrder: orderedIds });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  const available = exercises.filter((e) => !orderedIds.includes(e.id));

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="wname" className="block text-sm font-medium text-zinc-700">
          Workout name
        </label>
        <input
          id="wname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Push Day"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-700">Add exercises</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {available.length === 0 ? (
            <span className="text-sm text-zinc-500">All exercises are in this workout.</span>
          ) : (
            available.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => addExercise(ex.id)}
                className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-sm text-zinc-800 hover:bg-white"
              >
                + {ex.name}
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-700">Order</p>
        {orderedIds.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Tap exercises above to build the sequence.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {orderedIds.map((id, index) => {
              const label = exercises.find((e) => e.id === id)?.name ?? "Exercise";
              return (
                <li
                  key={`${id}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-zinc-900">
                    {index + 1}. {label}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                      aria-label="Move up"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                      aria-label="Move down"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save workout"}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createWorkoutSession,
  logExercisePerformance,
  updateSessionNotes,
} from "@/app/actions/workout-session";
import { formatIsoDate } from "@/lib/format-date";
import { formatPRDisplay } from "@/lib/pr";

export type RunnerExercise = {
  id: string;
  name: string;
  isBodyweight: boolean;
  previousBest: { weight: number; reps: number[] } | null;
  lastPerformance: { weight: number; reps: number[]; performedAt: string } | null;
};

function ExerciseLogForm({
  exercise,
  isLast,
  sessionId,
  onDone,
}: {
  exercise: RunnerExercise;
  isLast: boolean;
  sessionId: string;
  onDone: (
    result: Awaited<ReturnType<typeof logExercisePerformance>>,
    last: boolean,
    exercise: RunnerExercise
  ) => void;
}) {
  const lp = exercise.lastPerformance;
  const defaultLen = Math.max(3, lp?.reps.length ?? 3);
  const [weight, setWeight] = useState(() =>
    exercise.isBodyweight ? "" : lp ? String(lp.weight) : ""
  );
  const [reps, setReps] = useState(() =>
    Array.from({ length: defaultLen }, (_, i) =>
      lp?.reps[i] != null ? String(lp.reps[i]) : ""
    )
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addSet() {
    setReps((r) => [...r, ""]);
  }

  function updateRep(i: number, v: string) {
    setReps((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  async function submit(last: boolean) {
    const repsNums = reps
      .map((r) => parseInt(r, 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (repsNums.length === 0) {
      setSaveError("Log reps for at least one set.");
      return;
    }
    let load = 0;
    if (!exercise.isBodyweight) {
      const w = parseFloat(weight);
      if (!Number.isFinite(w) || w <= 0) {
        setSaveError("Enter a valid weight.");
        return;
      }
      load = w;
    }
    setSaveError(null);
    setPending(true);
    try {
      const result = await logExercisePerformance({
        sessionId,
        exerciseId: exercise.id,
        weight: load,
        repsBySet: repsNums,
      });
      onDone(result, last, exercise);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {!exercise.isBodyweight ? (
        <div className="max-w-xs">
          <label htmlFor="weight" className="block text-sm font-medium text-zinc-700">
            Weight (lb)
          </label>
          <input
            id="weight"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-600">Bodyweight — log reps for each set below.</p>
      )}

      <div className={exercise.isBodyweight ? "mt-2" : "mt-6"}>
        <p className="text-sm font-medium text-zinc-700">Sets</p>
        <div className="mt-3 space-y-2">
          {reps.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-14 text-sm text-zinc-500">Set {i + 1}</span>
              <input
                inputMode="numeric"
                value={r}
                onChange={(e) => updateRep(i, e.target.value)}
                className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                placeholder="reps"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSet}
          className="mt-3 text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
        >
          Add another set
        </button>
      </div>

      {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {!isLast ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void submit(false)}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save & next exercise"}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => void submit(true)}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save & finish workout"}
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkoutRunner({
  workoutId,
  workoutName,
  exercises,
}: {
  workoutId: string;
  workoutName: string;
  exercises: RunnerExercise[];
}) {
  const router = useRouter();
  const storageKey = useMemo(() => `gymnb_session_${workoutId}`, [workoutId]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [prBanner, setPrBanner] = useState<{
    name: string;
    isBodyweight: boolean;
    prev: { weight: number; reps: number[] } | null;
    next: { weight: number; reps: number[] };
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [notes, setNotes] = useState("");
  const [finishPending, setFinishPending] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const current = exercises[step];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;
        if (existing) {
          if (!cancelled) setSessionId(existing);
          return;
        }
        const id = await createWorkoutSession(workoutId);
        if (cancelled) return;
        sessionStorage.setItem(storageKey, id);
        setSessionId(id);
      } catch (e) {
        if (!cancelled) setSessionError(e instanceof Error ? e.message : "Could not start session");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workoutId, storageKey]);

  function handleLogged(
    result: Awaited<ReturnType<typeof logExercisePerformance>>,
    last: boolean,
    exercise: RunnerExercise
  ) {
    if (result.isPR) {
      setPrBanner({
        name: exercise.name,
        isBodyweight: exercise.isBodyweight,
        prev: result.previousBest,
        next: { weight: result.newMetrics.weight, reps: result.newReps },
      });
    } else {
      setPrBanner(null);
    }
    if (last) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  async function finishWorkout(overrideNotes?: string | null) {
    if (!sessionId) return;
    setFinishPending(true);
    setFinishError(null);
    const n = overrideNotes !== undefined ? overrideNotes : notes;
    try {
      await updateSessionNotes(sessionId, n?.trim() ? n.trim() : null);
      sessionStorage.removeItem(storageKey);
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setFinishError(e instanceof Error ? e.message : "Could not finish");
    } finally {
      setFinishPending(false);
    }
  }

  if (sessionError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {sessionError}
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 shadow-sm">
        Preparing session…
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
          <h2 className="text-lg font-semibold">Workout complete</h2>
          <p className="mt-1 text-sm text-emerald-800">
            Nice work on <span className="font-medium">{workoutName}</span>.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Session notes <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            placeholder="How it felt, sleep, injuries…"
          />
          {finishError ? <p className="mt-2 text-sm text-red-600">{finishError}</p> : null}
          <button
            type="button"
            onClick={() => void finishWorkout()}
            disabled={finishPending}
            className="mt-4 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {finishPending ? "Saving…" : "Finish & return to dashboard"}
          </button>
          <button
            type="button"
            onClick={() => void finishWorkout("")}
            className="mt-3 w-full text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Skip notes
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <p className="text-sm text-zinc-600">
        This workout has no exercises.{" "}
        <Link href="/workouts/new" className="font-medium text-zinc-900 underline">
          Edit templates
        </Link>
        .
      </p>
    );
  }

  const isLast = step === exercises.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Exercise {step + 1} of {exercises.length}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{current.name}</h2>
            {current.isBodyweight ? (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                Bodyweight
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-zinc-500">{workoutName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Previous best</p>
          {current.previousBest ? (
            <p className="mt-2 text-sm text-zinc-800 tabular-nums">
              {formatPRDisplay(
                current.previousBest.weight,
                current.previousBest.reps,
                current.isBodyweight
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No history yet — this could be your first PR.</p>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Last time</p>
          {current.lastPerformance ? (
            <p className="mt-2 text-sm text-zinc-800 tabular-nums">
              {formatIsoDate(current.lastPerformance.performedAt)}:{" "}
              {formatPRDisplay(
                current.lastPerformance.weight,
                current.lastPerformance.reps,
                current.isBodyweight
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No prior session for this movement.</p>
          )}
        </div>
      </div>

      {prBanner ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
          <p className="font-semibold">New Personal Record 🎉</p>
          <p className="mt-1 text-sm">
            {prBanner.name}:{" "}
            {prBanner.prev ? (
              <>
                from {formatPRDisplay(prBanner.prev.weight, prBanner.prev.reps, prBanner.isBodyweight)} →{" "}
                {formatPRDisplay(prBanner.next.weight, prBanner.next.reps, prBanner.isBodyweight)}
              </>
            ) : (
              <>
                first recorded entry at{" "}
                {formatPRDisplay(prBanner.next.weight, prBanner.next.reps, prBanner.isBodyweight)}
              </>
            )}
          </p>
        </div>
      ) : null}

      <ExerciseLogForm
        key={current.id}
        exercise={current}
        isLast={isLast}
        sessionId={sessionId}
        onDone={handleLogged}
      />
    </div>
  );
}

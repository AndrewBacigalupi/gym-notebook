"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  averageReps,
  bestPR,
  isStrictlyBetterPR,
  prScoreFromMetrics,
  type PRMetrics,
} from "@/lib/pr";

export async function createWorkoutSession(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: user.id, workout_id: workoutId })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not start session");
  return data.id as string;
}

type ExerciseLogRow = {
  weight: number;
  session_id: string;
  workout_sessions: { user_id: string; performed_at: string };
  set_logs: { reps: number; set_number: number }[] | null;
};

async function fetchHistoricalMetricsForExercise(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exerciseId: string,
  excludeSessionId?: string
): Promise<PRMetrics[]> {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      weight,
      session_id,
      workout_sessions!inner ( user_id, performed_at ),
      set_logs ( reps, set_number )
    `
    )
    .eq("exercise_id", exerciseId);

  if (error) throw new Error(error.message);

  const metrics: PRMetrics[] = [];
  for (const raw of data ?? []) {
    const row = raw as unknown as ExerciseLogRow;
    if (row.workout_sessions.user_id !== userId) continue;
    if (excludeSessionId && row.session_id === excludeSessionId) continue;
    const sets = row.set_logs;
    const weight = Number(row.weight);
    if (!sets?.length) continue;
    const ordered = [...sets].sort((a, b) => a.set_number - b.set_number);
    const reps = ordered.map((s) => s.reps);
    metrics.push({ weight, avgReps: averageReps(reps) });
  }
  return metrics;
}

export async function logExercisePerformance(input: {
  sessionId: string;
  exerciseId: string;
  weight: number;
  repsBySet: number[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const weight = input.weight;
  const reps = input.repsBySet.filter((r) => Number.isFinite(r));
  if (reps.length === 0) throw new Error("Enter reps for at least one set");

  const { data: session, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id, user_id")
    .eq("id", input.sessionId)
    .single();

  if (sErr || !session || session.user_id !== user.id) {
    throw new Error("Invalid session");
  }

  const prior = await fetchHistoricalMetricsForExercise(
    supabase,
    user.id,
    input.exerciseId,
    input.sessionId
  );
  const candidate: PRMetrics = {
    weight,
    avgReps: averageReps(reps),
  };
  const previousBest = bestPR(prior);
  const isPR =
    previousBest === undefined
      ? true
      : isStrictlyBetterPR(candidate, previousBest);

  const prScore = prScoreFromMetrics(candidate);

  const { data: logRow, error: logErr } = await supabase
    .from("exercise_logs")
    .insert({
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      weight,
      pr_score: prScore,
      is_personal_record: isPR,
    })
    .select("id")
    .single();

  if (logErr || !logRow) throw new Error(logErr?.message ?? "Failed to log exercise");

  const setRows = reps.map((reps, i) => ({
    exercise_log_id: logRow.id,
    set_number: i + 1,
    reps: Math.round(reps),
  }));

  const { error: setErr } = await supabase.from("set_logs").insert(setRows);
  if (setErr) throw new Error(setErr.message);

  revalidatePath("/dashboard");
  revalidatePath("/progress");

  return {
    isPR,
    prScore,
    previousBest: previousBest ?? null,
    newMetrics: candidate,
  };
}

export async function updateSessionNotes(sessionId: string, notes: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("workout_sessions")
    .update({ notes: notes?.trim() || null })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

import { createClient } from "@/lib/supabase/server";
import { averageReps, bestPerformanceEntry, type PRMetrics } from "@/lib/pr";

type LogRow = {
  weight: number;
  session_id: string;
  workout_sessions: { performed_at: string; user_id: string };
  set_logs: { reps: number; set_number: number }[] | null;
};

function parseLogs(rows: LogRow[] | null | undefined) {
  const parsed: {
    metrics: PRMetrics;
    performedAt: string;
    weight: number;
    reps: number[];
  }[] = [];

  for (const row of rows ?? []) {
    const sets = row.set_logs;
    if (!sets?.length) continue;
    const ordered = [...sets].sort((a, b) => a.set_number - b.set_number);
    const reps = ordered.map((s) => s.reps);
    const weight = Number(row.weight);
    parsed.push({
      metrics: { weight, avgReps: averageReps(reps) },
      performedAt: row.workout_sessions.performed_at,
      weight,
      reps,
    });
  }
  return parsed;
}

export async function getExerciseInsightsForUser(
  userId: string,
  exerciseId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      weight,
      session_id,
      workout_sessions!inner ( performed_at, user_id ),
      set_logs ( reps, set_number )
    `
    )
    .eq("exercise_id", exerciseId);

  if (error) throw new Error(error.message);

  const rows = (data ?? []).filter(
    (r) => (r as unknown as LogRow).workout_sessions.user_id === userId
  ) as unknown as LogRow[];

  const parsed = parseLogs(rows);
  const entries = parsed.map((p) => ({ metrics: p.metrics, reps: p.reps }));
  const previousBest = bestPerformanceEntry(entries);

  const last = [...parsed].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  )[0];

  return {
    previousBest: previousBest
      ? {
          weight: previousBest.metrics.weight,
          reps: previousBest.reps,
        }
      : null,
    lastPerformance: last
      ? {
          weight: last.weight,
          reps: last.reps,
          performedAt: last.performedAt,
        }
      : null,
  };
}

export async function getExerciseFullHistory(userId: string, exerciseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_logs")
    .select(
      `
      id,
      session_id,
      weight,
      is_personal_record,
      workout_sessions!inner ( performed_at, user_id ),
      set_logs ( reps, set_number )
    `
    )
    .eq("exercise_id", exerciseId);

  if (error) throw new Error(error.message);

  type HistoryRow = LogRow & {
    id: string;
    session_id: string;
    is_personal_record: boolean;
  };

  const rows = (data ?? []).filter(
    (r) => (r as unknown as LogRow).workout_sessions.user_id === userId
  ) as unknown as HistoryRow[];

  rows.sort(
    (a, b) =>
      new Date(b.workout_sessions.performed_at).getTime() -
      new Date(a.workout_sessions.performed_at).getTime()
  );

  return rows
    .map((row) => {
      const sets = row.set_logs;
      if (!sets?.length) return null;
      const ordered = [...sets].sort((a, b) => a.set_number - b.set_number);
      const reps = ordered.map((s) => s.reps);
      return {
        id: row.id,
        sessionId: row.session_id,
        performedAt: row.workout_sessions.performed_at,
        weight: Number(row.weight),
        reps,
        isPR: row.is_personal_record,
      };
    })
    .filter(Boolean) as {
    id: string;
    sessionId: string;
    performedAt: string;
    weight: number;
    reps: number[];
    isPR: boolean;
  }[];
}

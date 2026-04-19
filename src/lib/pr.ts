/**
 * PR ordering: higher weight wins; if weight ties, higher average reps wins.
 * (Weight × avg reps is not used for ranking — only stored optionally for analytics.)
 */

export type PRMetrics = {
  weight: number;
  avgReps: number;
};

export type PerformanceEntry = {
  metrics: PRMetrics;
  reps: number[];
};

export function averageReps(reps: number[]): number {
  if (reps.length === 0) return 0;
  return reps.reduce((a, b) => a + b, 0) / reps.length;
}

export function prScore(weight: number, reps: number[]): number {
  return weight * averageReps(reps);
}

export function prScoreFromMetrics(m: PRMetrics): number {
  return m.weight * m.avgReps;
}

/** Returns positive if a is strictly better than b. */
export function comparePR(a: PRMetrics, b: PRMetrics): number {
  if (a.weight !== b.weight) return a.weight - b.weight;
  return a.avgReps - b.avgReps;
}

export function isStrictlyBetterPR(candidate: PRMetrics, incumbent: PRMetrics): boolean {
  return comparePR(candidate, incumbent) > 0;
}

/** Best performance in a list (by weight, then avg reps); undefined if empty. */
export function bestPerformanceEntry(entries: PerformanceEntry[]): PerformanceEntry | undefined {
  if (entries.length === 0) return undefined;
  return entries.reduce((best, cur) =>
    isStrictlyBetterPR(cur.metrics, best.metrics) ? cur : best
  );
}

/** Best PR in a list of metrics only (no per-set reps); undefined if empty. */
export function bestPR(entries: PRMetrics[]): PRMetrics | undefined {
  if (entries.length === 0) return undefined;
  return entries.reduce((best, cur) => (isStrictlyBetterPR(cur, best) ? cur : best));
}

/** Display: `60 lb × 10, 9, 8` or `BW × 10, 9, 8` for bodyweight. */
export function formatPRDisplay(
  weight: number,
  reps: number[],
  isBodyweight = false
): string {
  if (isBodyweight) {
    if (reps.length === 0) return "BW";
    return `BW × ${reps.join(", ")}`;
  }
  if (reps.length === 0) return `${weight} lb`;
  return `${weight} lb × ${reps.join(", ")}`;
}

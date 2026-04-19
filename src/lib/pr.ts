/**
 * PR ordering: higher composite score wins; tie-break by weight, then average reps.
 */

export type PRMetrics = {
  weight: number;
  avgReps: number;
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
  const sa = prScoreFromMetrics(a);
  const sb = prScoreFromMetrics(b);
  if (sa !== sb) return sa - sb;
  if (a.weight !== b.weight) return a.weight - b.weight;
  return a.avgReps - b.avgReps;
}

export function isStrictlyBetterPR(candidate: PRMetrics, incumbent: PRMetrics): boolean {
  return comparePR(candidate, incumbent) > 0;
}

/** Best PR in a list; undefined if empty. */
export function bestPR(entries: PRMetrics[]): PRMetrics | undefined {
  if (entries.length === 0) return undefined;
  return entries.reduce((best, cur) =>
    isStrictlyBetterPR(cur, best) ? cur : best
  );
}

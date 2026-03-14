/**
 * Check whether a scenario's samples have converged: 95% CI margin
 * is within targetMarginPct of the median.  Zero-variance metrics
 * (e.g. ref-stability counts) converge after minSamples.
 */
export function isConverged(
  samples: number[],
  warmupCount: number,
  targetMarginPct: number,
  minSamples: number,
): boolean {
  const trimmed = samples.slice(warmupCount);
  if (trimmed.length < minSamples) return false;
  const mean = trimmed.reduce((sum, x) => sum + x, 0) / trimmed.length;
  if (mean === 0) return true;
  const stdDev = Math.sqrt(
    trimmed.reduce((sum, x) => sum + (x - mean) ** 2, 0) / trimmed.length,
  );
  const margin = 1.96 * (stdDev / Math.sqrt(trimmed.length));
  return (margin / Math.abs(mean)) * 100 <= targetMarginPct;
}

/**
 * Compute median, p95, and approximate 95% confidence interval from samples.
 * Discards warmup runs.
 */
export function computeStats(
  samples: number[],
  warmupCount: number,
): { median: number; p95: number; range: string } {
  const trimmed = samples.slice(warmupCount);
  if (trimmed.length === 0) {
    return { median: 0, p95: 0, range: '± 0' };
  }
  const sorted = [...trimmed].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const p95Idx = Math.floor(sorted.length * 0.95);
  const p95 = sorted[Math.min(p95Idx, sorted.length - 1)] ?? median;
  const mean = trimmed.reduce((sum, x) => sum + x, 0) / trimmed.length;
  const stdDev = Math.sqrt(
    trimmed.reduce((sum, x) => sum + (x - mean) ** 2, 0) / trimmed.length,
  );
  const margin = 1.96 * (stdDev / Math.sqrt(trimmed.length));
  return {
    median,
    p95,
    range: `± ${margin.toFixed(2)}`,
  };
}

/**
 * Remove outliers using the IQR method (1.5×IQR fence).
 * Input must be sorted ascending. Falls back to the full array when
 * there are fewer than 4 samples or the IQR is zero.
 */
function trimOutliers(sorted: number[]): number[] {
  if (sorted.length < 4) return sorted;
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  if (iqr === 0) return sorted;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const result = sorted.filter(x => x >= lower && x <= upper);
  return result.length >= 2 ? result : sorted;
}

/**
 * Check whether a scenario's samples have converged: 95% CI margin
 * is within targetMarginPct of the median.  Zero-variance metrics
 * (e.g. ref-stability counts) converge after minSamples.
 *
 * Outliers are trimmed via IQR before computing the CI so that a
 * single GC spike doesn't prevent convergence.
 */
export function isConverged(
  samples: number[],
  warmupCount: number,
  targetMarginPct: number,
  minSamples: number,
): boolean {
  const measured = samples.slice(warmupCount);
  if (measured.length < minSamples) return false;
  const sorted = [...measured].sort((a, b) => a - b);
  const clean = trimOutliers(sorted);
  const mean = clean.reduce((sum, x) => sum + x, 0) / clean.length;
  if (mean === 0) return true;
  const stdDev = Math.sqrt(
    clean.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (clean.length - 1),
  );
  const margin = 1.96 * (stdDev / Math.sqrt(clean.length));
  return (margin / Math.abs(mean)) * 100 <= targetMarginPct;
}

/**
 * Compute median, p95, and approximate 95% confidence interval from samples.
 * Discards warmup runs, then trims IQR outliers for median and CI
 * computation. p95 uses the full (untrimmed) sorted data.
 */
export function computeStats(
  samples: number[],
  warmupCount: number,
): { median: number; p95: number; range: string } {
  const measured = samples.slice(warmupCount);
  if (measured.length <= 1) {
    const v = measured[0] ?? 0;
    return { median: v, p95: v, range: '± 0' };
  }
  const sorted = [...measured].sort((a, b) => a - b);
  const clean = trimOutliers(sorted);
  const median = clean[Math.floor(clean.length / 2)] ?? 0;
  const p95Idx = Math.floor(sorted.length * 0.95);
  const p95 = sorted[Math.min(p95Idx, sorted.length - 1)] ?? median;
  const mean = clean.reduce((sum, x) => sum + x, 0) / clean.length;
  const stdDev =
    clean.length > 1 ?
      Math.sqrt(
        clean.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (clean.length - 1),
      )
    : 0;
  const margin = 1.96 * (stdDev / Math.sqrt(clean.length));
  return {
    median,
    p95,
    range: `± ${margin.toFixed(2)}`,
  };
}

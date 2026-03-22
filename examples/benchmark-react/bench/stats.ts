/**
 * Two-tailed t critical values for 95% CI (α = 0.05) keyed by
 * degrees of freedom. Falls back to z = 1.96 for df > 30.
 */
const T_CRIT_95: Record<number, number> = {
  1: 12.706,
  2: 4.303,
  3: 3.182,
  4: 2.776,
  5: 2.571,
  6: 2.447,
  7: 2.365,
  8: 2.306,
  9: 2.262,
  10: 2.228,
  11: 2.201,
  12: 2.179,
  13: 2.16,
  14: 2.145,
  15: 2.131,
  20: 2.086,
  25: 2.06,
  30: 2.042,
};

function tCrit95(n: number): number {
  const df = n - 1;
  if (df <= 0) return 1.96;
  if (df in T_CRIT_95) return T_CRIT_95[df];
  const keys = Object.keys(T_CRIT_95)
    .map(Number)
    .sort((a, b) => a - b);
  const lower = keys.filter(k => k <= df).pop();
  const upper = keys.find(k => k >= df);
  if (lower == null) return T_CRIT_95[keys[0]];
  if (upper == null || lower === upper) return T_CRIT_95[lower];
  const frac = (df - lower) / (upper - lower);
  return T_CRIT_95[lower] + frac * (T_CRIT_95[upper] - T_CRIT_95[lower]);
}

function sortedMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ?
      (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

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
 * Median Absolute Deviation — robust dispersion estimator with 50%
 * breakdown point. Scale factor 1.4826 makes it consistent with
 * stddev for normal distributions.
 */
function scaledMAD(sorted: number[]): number {
  const med = sortedMedian(sorted);
  const deviations = sorted.map(x => Math.abs(x - med)).sort((a, b) => a - b);
  return 1.4826 * sortedMedian(deviations);
}

/**
 * Compute the 95% CI margin using MAD-based dispersion and t-distribution
 * critical values for small samples. Falls back to stddev when MAD is zero
 * (all values identical except outliers) to avoid reporting ± 0 misleadingly.
 */
function ciMargin(clean: number[]): number {
  if (clean.length < 2) return 0;
  const t = tCrit95(clean.length);
  const mad = scaledMAD(clean);
  if (mad > 0) {
    return t * (mad / Math.sqrt(clean.length));
  }
  const mean = clean.reduce((sum, x) => sum + x, 0) / clean.length;
  const stdDev = Math.sqrt(
    clean.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (clean.length - 1),
  );
  return t * (stdDev / Math.sqrt(clean.length));
}

/**
 * Check whether a scenario's samples have converged: 95% CI margin
 * is within targetMarginPct of the median.  Zero-variance metrics
 * (e.g. ref-stability counts) converge after minSamples only when
 * the margin is also zero.
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
  const median = sortedMedian(clean);
  const margin = ciMargin(clean);
  if (median === 0) return margin === 0;
  return (margin / Math.abs(median)) * 100 <= targetMarginPct;
}

/**
 * Compute median, p95, and approximate 95% confidence interval from samples.
 * Discards warmup runs, then trims IQR outliers for median and CI
 * computation. p95 uses the full (untrimmed) sorted data.
 *
 * Uses MAD (Median Absolute Deviation) instead of stddev for the CI
 * margin — MAD is far more robust to heavy-tailed distributions and
 * residual outliers typical of browser benchmarks.
 */
export function computeStats(
  samples: number[],
  warmupCount: number,
): { median: number; p95: number; range: string } {
  const measured = samples.slice(warmupCount);
  if (measured.length <= 1) {
    const v = measured[0] ?? 0;
    return { median: v, p95: v, range: '± 0.0%' };
  }
  const sorted = [...measured].sort((a, b) => a - b);
  const clean = trimOutliers(sorted);
  const median = sortedMedian(clean);
  const p95Idx = Math.floor(sorted.length * 0.95);
  const p95 = sorted[Math.min(p95Idx, sorted.length - 1)] ?? median;
  const margin = ciMargin(clean);
  const pct = median !== 0 ? (margin / Math.abs(median)) * 100 : 0;
  return {
    median,
    p95,
    range: `± ${pct.toFixed(1)}%`,
  };
}

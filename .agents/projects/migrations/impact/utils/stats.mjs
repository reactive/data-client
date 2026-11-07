// Small, dependency-free statistics for before/after comparisons.

export const median = a => quantile(a, 0.5);

export function quantile(a, q) {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

// Deterministic PRNG so reports are reproducible from the same samples.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 95% bootstrap interval for median(after) - median(before). */
export function bootstrapDiff(before, after, iterations = 2000, seed = 1) {
  const rand = mulberry32(seed);
  const pick = a => a[Math.floor(rand() * a.length)];
  const diffs = [];
  for (let i = 0; i < iterations; i++) {
    const b = before.map(() => pick(before));
    const m = after.map(() => pick(after));
    diffs.push(median(m) - median(b));
  }
  return [quantile(diffs, 0.025), quantile(diffs, 0.975)];
}

export const round = (x, d = 2) =>
  Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : x;

/** better | worse for a non-zero change; 'changed' when no direction is preferred (lowerIsBetter null). */
export const direction = (delta, lowerIsBetter) =>
  lowerIsBetter === null ? 'changed'
  : delta < 0 === lowerIsBetter ? 'better'
  : 'worse';

/**
 * Summarize one metric's samples from both variants.
 * verdict: 'better' | 'worse' | 'noise' | 'same' | 'few runs' | 'changed', using lowerIsBetter.
 */
export function compare(before, after, { lowerIsBetter = true } = {}) {
  const b = before.filter(Number.isFinite);
  const a = after.filter(Number.isFinite);
  const mb = round(median(b));
  const ma = round(median(a));
  // Verdicts use the same rounding as the printed values, so a change too small to show is never "worse".
  const delta = round(ma - mb);
  const ci =
    b.length > 1 && a.length > 1 ?
      bootstrapDiff(b, a).map(x => round(x))
    : [delta, delta];
  let verdict;
  if (delta === 0 && ci[0] === 0 && ci[1] === 0) verdict = 'same';
  // Too few samples for an interval; one run is enough only for counts that never vary.
  else if (b.length < 3 || a.length < 3) verdict = 'few runs';
  // A printed change of 0 is never a direction, even when the interval excludes 0.
  else if (delta === 0 || (ci[0] <= 0 && ci[1] >= 0)) verdict = 'noise';
  else verdict = direction(delta, lowerIsBetter);
  return {
    baseline: mb,
    migrated: ma,
    delta,
    pct: mb ? round((delta / mb) * 100, 1) : null,
    ci95: ci,
    spread: {
      baseline: [round(quantile(b, 0.25)), round(quantile(b, 0.75))],
      migrated: [round(quantile(a, 0.25)), round(quantile(a, 0.75))],
    },
    n: { baseline: b.length, migrated: a.length },
    verdict,
  };
}

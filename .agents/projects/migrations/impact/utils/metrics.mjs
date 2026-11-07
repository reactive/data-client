// The one row shape every tool emits, so report.mjs can merge any of them.
//
// { group, id, label, unit, lowerIsBetter, baseline, migrated, delta, pct, verdict,
//   ci95?, spread?, n? }
//
// verdict: better | worse | same | noise (CI includes 0) | changed (no preferred direction)

const round = (x, d = 2) =>
  Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : x;

/** A metric measured once per variant (static analysis, token counts of a single run). */
export function metric(
  group,
  id,
  label,
  unit,
  baseline,
  migrated,
  { lowerIsBetter = true } = {},
) {
  const delta = round(migrated) - round(baseline);
  let verdict = 'same';
  if (delta !== 0) {
    if (lowerIsBetter === null) verdict = 'changed';
    else verdict = delta < 0 === lowerIsBetter ? 'better' : 'worse';
  }
  return {
    group,
    id,
    label,
    unit,
    lowerIsBetter,
    baseline: round(baseline),
    migrated: round(migrated),
    delta: round(delta),
    pct: baseline ? round((delta / baseline) * 100, 1) : null,
    verdict,
  };
}

/** A metric with repeated samples, from stats.compare(). */
export function sampled(
  group,
  id,
  label,
  unit,
  cmp,
  { lowerIsBetter = true } = {},
) {
  return { group, id, label, unit, lowerIsBetter, ...cmp };
}

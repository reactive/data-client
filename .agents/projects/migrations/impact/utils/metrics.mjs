// The one row shape every tool emits, so report.mjs can merge any of them.
//
// { group, id, label, unit, lowerIsBetter, baseline, migrated, delta, pct, verdict,
//   ci95?, spread?, n? }
//
// verdict: better | worse | same | noise (CI includes 0) | few runs (under 3 per variant)
//   | changed (no preferred direction)

import { compare, direction, round } from './stats.mjs';

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
  if (delta !== 0) verdict = direction(delta, lowerIsBetter);
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

/** A metric with repeated samples per variant, compared with stats.compare(). */
export function sampled(
  group,
  id,
  label,
  unit,
  before,
  after,
  { lowerIsBetter = true } = {},
) {
  return {
    group,
    id,
    label,
    unit,
    lowerIsBetter,
    ...compare(before, after, { lowerIsBetter }),
  };
}

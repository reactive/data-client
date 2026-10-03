/**
 * Pure GC interaction metric helpers + stable scenario IDs.
 * Deterministic — safe to unit-test without Playwright timing.
 */

import type { GCScenarioConfig } from '@shared/types';

import {
  CANONICAL_COUNTS,
  parseScenarioId,
  scenarioId,
} from '../../../gc-shared/protocol.js';

export {
  computeMaxInputDelayMs,
  frameIntervalsFromTimestamps,
  measureDisplayPeriodMs,
  median,
} from '../../../gc-shared/frames.js';

/**
 * Count excess whole display periods beyond the single expected vsync gap.
 *
 * Uses nearest-period (Math.round) rather than floor: rAF timestamps jitter, so
 * a true 2-period stall often measures slightly under 2×displayPeriodMs
 * (e.g. 1.98×). floor() would report 0 missed frames; round() recovers the
 * intended whole-period count. Sub-period noise around 1× still rounds to 1
 * (zero excess).
 */
export function excessMissedFrames(
  frameIntervalsMs: number[],
  displayPeriodMs: number,
): number {
  if (!(displayPeriodMs > 0)) return 0;
  let missed = 0;
  for (const interval of frameIntervalsMs) {
    const periods = Math.round(interval / displayPeriodMs);
    missed += Math.max(0, periods - 1);
  }
  return missed;
}

/** LongTask overlaps measurement window (entry may start just before windowStart). */
export function longTaskOverlapsWindow(
  entry: { startTime: number; duration: number },
  windowStart: number,
  windowEnd: number,
): boolean {
  return (
    entry.startTime < windowEnd &&
    entry.startTime + entry.duration > windowStart
  );
}

/** Canonical GC counts shared with the Node/Android harnesses (gc-shared protocol). */
export const GC_CANONICAL_COUNTS = CANONICAL_COUNTS;

/**
 * Stable detailed-report scenario ID from validated axes (not display names).
 * Format: browser/{kind}/{pattern}/{count}/end-to-end/{control}
 */
export function browserGCScenarioId(
  axes: Pick<
    GCScenarioConfig,
    'candidateKind' | 'pattern' | 'count' | 'control'
  >,
): string {
  return scenarioId({ platform: 'browser', mode: 'end-to-end', ...axes });
}

/** Parse a stable ID back to axes (throws on malformed or non-browser ids). */
export function parseBrowserGCScenarioId(id: string): {
  platform: 'browser';
  candidateKind: GCScenarioConfig['candidateKind'];
  pattern: GCScenarioConfig['pattern'];
  count: number;
  mode: 'end-to-end';
  control: GCScenarioConfig['control'];
} {
  const axes = parseScenarioId(id);
  if (axes.platform !== 'browser') {
    throw new Error(`malformed browser GC scenario id: ${id}`);
  }
  return { ...axes, platform: 'browser', mode: 'end-to-end' };
}

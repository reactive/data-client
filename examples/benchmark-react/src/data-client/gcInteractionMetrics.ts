/**
 * Pure GC interaction metric helpers + stable scenario IDs.
 * Deterministic — safe to unit-test without Playwright timing.
 */

import type { GCScenarioConfig } from '@shared/types';

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

/**
 * Responsiveness proxy from timer + frame probes (not pointer input).
 * max(timerDelayMs, largest frame-interval excess over one display period).
 */
export function computeMaxInputDelayMs(
  timerDelayMs: number,
  frameIntervalsMs: number[],
  displayPeriodMs: number,
): number {
  let maxExcessFrame = 0;
  if (displayPeriodMs > 0) {
    for (const interval of frameIntervalsMs) {
      maxExcessFrame = Math.max(
        maxExcessFrame,
        Math.max(0, interval - displayPeriodMs),
      );
    }
  }
  return Math.max(timerDelayMs, maxExcessFrame);
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

/** Convert consecutive rAF timestamps into raw intervals. */
export function frameIntervalsFromTimestamps(timestamps: number[]): number[] {
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  return intervals;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ?
      (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/** Quiet rAF intervals → display period (never hardcode 16.67). */
export async function measureDisplayPeriodMs(samples = 8): Promise<number> {
  const intervals: number[] = [];
  await new Promise<void>(resolve => {
    let last = 0;
    let n = 0;
    const frame = (now: number) => {
      if (n > 0) intervals.push(now - last);
      last = now;
      n++;
      if (n <= samples) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
  return median(intervals);
}

/** Canonical GC counts (must match `GC_CANONICAL_COUNTS` in bench/scenarios.ts). */
const CANONICAL_COUNTS: readonly number[] = [1_000, 10_000, 100_000];

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
  const { candidateKind, pattern, count, control } = axes;
  if (
    candidateKind !== 'entity' &&
    candidateKind !== 'endpoint' &&
    candidateKind !== 'mixed'
  ) {
    throw new Error(`invalid candidateKind: ${candidateKind}`);
  }
  if (pattern !== 'unique' && pattern !== 'duplicate') {
    throw new Error(`invalid pattern: ${pattern}`);
  }
  if (pattern === 'duplicate' && candidateKind !== 'entity') {
    throw new Error('duplicate pattern requires candidateKind=entity');
  }
  if (!Number.isInteger(count) || !CANONICAL_COUNTS.includes(count)) {
    throw new Error(
      `invalid count: ${count}; expected one of ${CANONICAL_COUNTS.join('|')}`,
    );
  }
  if (control !== 'gc' && control !== 'no-gc') {
    throw new Error(`invalid control: ${control}`);
  }
  return `browser/${candidateKind}/${pattern}/${count}/end-to-end/${control}`;
}

/** Parse a stable ID back to axes (throws on malformed). */
export function parseBrowserGCScenarioId(id: string): {
  platform: 'browser';
  candidateKind: GCScenarioConfig['candidateKind'];
  pattern: GCScenarioConfig['pattern'];
  count: number;
  mode: 'end-to-end';
  control: GCScenarioConfig['control'];
} {
  const parts = id.split('/');
  if (
    parts.length !== 6 ||
    parts[0] !== 'browser' ||
    parts[4] !== 'end-to-end'
  ) {
    throw new Error(`malformed browser GC scenario id: ${id}`);
  }
  const axes = {
    candidateKind: parts[1] as GCScenarioConfig['candidateKind'],
    pattern: parts[2] as GCScenarioConfig['pattern'],
    count: Number(parts[3]),
    control: parts[5] as GCScenarioConfig['control'],
  };
  // Re-validate via builder (rejects invalid axis combos)
  if (browserGCScenarioId(axes) !== id) {
    throw new Error(`browser GC scenario id failed revalidation: ${id}`);
  }
  return {
    platform: 'browser',
    ...axes,
    mode: 'end-to-end',
  };
}

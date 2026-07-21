/**
 * JS frame / responsiveness helpers (rAF + timers; not pointer latency).
 *
 * Native UI missed-frame math differs by capture source:
 * - FrameMetrics TOTAL_DURATION is a *duration* → ceil(duration/period) − 1
 * - Choreographer deltas are *intervals* → round(interval/period) − 1 (same as JS rAF)
 */
import type { UiCaptureSource } from './types';

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Adjacent differences of rAF timestamps (ms). */
export function frameIntervalsFromTimestamps(timestampsMs: number[]): number[] {
  const intervals: number[] = [];
  for (let i = 1; i < timestampsMs.length; i++) {
    intervals.push(timestampsMs[i] - timestampsMs[i - 1]);
  }
  return intervals;
}

/**
 * FrameMetrics TOTAL_DURATION → excess missed frames.
 * Conservative: ceil so a duration just over one period counts as a miss.
 */
export function missedFramesFromDurationMs(
  durationMs: number,
  refreshPeriodMs: number,
): number {
  if (!(refreshPeriodMs > 0) || !(durationMs > 0)) return 0;
  return Math.max(0, Math.ceil(durationMs / refreshPeriodMs) - 1);
}

/**
 * Choreographer / JS rAF *interval* → excess missed frames (nearest-period).
 */
export function missedFramesFromIntervalMs(
  intervalMs: number,
  refreshPeriodMs: number,
): number {
  if (!(refreshPeriodMs > 0) || !(intervalMs > 0)) return 0;
  return Math.max(0, Math.round(intervalMs / refreshPeriodMs) - 1);
}

/** Sum FrameMetrics-style duration misses. */
export function excessMissedFramesFromDurations(
  durationsMs: number[],
  refreshPeriodMs: number,
): number {
  let missed = 0;
  for (const d of durationsMs) {
    missed += missedFramesFromDurationMs(d, refreshPeriodMs);
  }
  return missed;
}

/**
 * Sum interval-style misses (JS rAF / Choreographer).
 */
export function excessMissedFramesFromIntervals(
  intervalsMs: number[],
  displayPeriodMs: number,
): number {
  let missed = 0;
  for (const interval of intervalsMs) {
    missed += missedFramesFromIntervalMs(interval, displayPeriodMs);
  }
  return missed;
}

export function missedFramesFromTimestamps(
  timestampsMs: number[],
  displayPeriodMs: number,
): number {
  return excessMissedFramesFromIntervals(
    frameIntervalsFromTimestamps(timestampsMs),
    displayPeriodMs,
  );
}

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

export interface UiFrameCaptureAggregate {
  source: UiCaptureSource;
  frameCount: number;
  maxFrameDurationMs: number;
  totalFrameDurationMs: number;
  missedFrames: number;
  refreshPeriodMs: number;
  refreshRateHz: number;
}

/**
 * Reject invalid refresh period or zero/insufficient native frames.
 * Missed-frame math must match capture source semantics.
 */
export function validateUiFrameCapture(
  result: UiFrameCaptureAggregate,
  options: { minFrames?: number } = {},
): void {
  const minFrames = options.minFrames ?? 1;
  if (
    !(result.refreshPeriodMs > 0) ||
    !Number.isFinite(result.refreshPeriodMs)
  ) {
    throw new Error(
      `invalid ui refreshPeriodMs=${String(result.refreshPeriodMs)}`,
    );
  }
  if (!(result.refreshRateHz > 0) || !Number.isFinite(result.refreshRateHz)) {
    throw new Error(`invalid ui refreshRateHz=${String(result.refreshRateHz)}`);
  }
  if (!Number.isInteger(result.frameCount) || result.frameCount < minFrames) {
    throw new Error(
      `insufficient ui frames: frameCount=${result.frameCount} (need >= ${minFrames}); source=${result.source}`,
    );
  }
  if (
    !Number.isFinite(result.maxFrameDurationMs) ||
    result.maxFrameDurationMs < 0 ||
    !Number.isFinite(result.totalFrameDurationMs) ||
    result.totalFrameDurationMs < 0
  ) {
    throw new Error('invalid ui frame duration aggregates');
  }
  if (result.source !== 'FrameMetrics' && result.source !== 'Choreographer') {
    throw new Error(`unknown ui capture source: ${String(result.source)}`);
  }
}

/**
 * JS frame / responsiveness helpers (rAF + timers; not pointer latency).
 *
 * Native UI missed-frame math differs by capture source:
 * - FrameMetrics TOTAL_DURATION is a *duration* → ceil(duration/period) − 1
 * - Choreographer deltas are *intervals* → round(interval/period) − 1 (same as JS rAF)
 */
import type { UiFrameCaptureResult } from './BenchNative';
import { frameIntervalsFromTimestamps } from '../../gc-shared/frames.js';

export {
  computeMaxInputDelayMs,
  frameIntervalsFromTimestamps,
  measureDisplayPeriodMs,
  median,
} from '../../gc-shared/frames.js';

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

/**
 * FrameMetrics dropCountSinceLastInvocation is a loss count, not jank.
 * The flag is set when the summed count is non-zero. Callers must not add
 * the count to missedFrames or uiMissedFrames.
 */
export function withFrameMetricsLoss<
  T extends { missedFrames: number; uiMissedFrames: number },
>(
  sample: T,
  droppedFrameMetrics: number,
): T & {
  uiDroppedFrameMetrics: number;
  uiFrameMetricsDropped: boolean;
} {
  if (!Number.isInteger(droppedFrameMetrics) || droppedFrameMetrics < 0) {
    throw new Error(
      `invalid FrameMetrics drop count: ${String(droppedFrameMetrics)}`,
    );
  }
  return {
    ...sample,
    missedFrames: sample.missedFrames,
    uiMissedFrames: sample.uiMissedFrames,
    uiDroppedFrameMetrics: droppedFrameMetrics,
    uiFrameMetricsDropped: droppedFrameMetrics > 0,
  };
}

/**
 * Reject invalid refresh period or zero/insufficient native frames.
 * Missed-frame math must match capture source semantics.
 */
export function validateUiFrameCapture(
  result: UiFrameCaptureResult,
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
  if (
    !Number.isInteger(result.droppedFrameMetrics) ||
    result.droppedFrameMetrics < 0
  ) {
    throw new Error(
      `invalid FrameMetrics drop count: ${String(result.droppedFrameMetrics)}`,
    );
  }
}

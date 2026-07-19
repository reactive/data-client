/**
 * Interaction measurement: quiet display period (prepare), UI frame capture +
 * sustained JS animation, explicit cache GC inside an rAF, post frames, timer
 * probe. Aggregate only — no per-candidate logs or bridge calls per frame.
 *
 * Engine GC must not run inside interaction timing.
 * Captured GC action is released before after-memory; live store retained until dispose.
 * UI frame capture / JS animation always torn down in finally (including rAF failures).
 */
import BenchNative, { readJsHeapBytes } from './BenchNative';
import type { MemorySnapshot, UiFrameCaptureResult } from './BenchNative';
import {
  computeMaxInputDelayMs,
  excessMissedFramesFromIntervals,
  frameIntervalsFromTimestamps,
  measureDisplayPeriodMs,
  validateUiFrameCapture,
} from './frames';
import {
  countRemaining,
  createHarness,
  validateMeasurement,
  GC,
  type Harness,
} from './gcHarness';
import { runRafCollectSequence } from './rafCollectSequence';
import type {
  GCAndroidMeasurement,
  GCPreparedSummary,
  GCScenarioConfig,
} from './types';

interface Session {
  config: GCScenarioConfig;
  harness: Harness;
  displayPeriodMs: number;
}

let session: Session | null = null;
let animationHandle: number | null = null;
let onAnimationTick: ((t: number) => void) | null = null;

export function setAnimationTickListener(
  listener: ((t: number) => void) | null,
) {
  onAnimationTick = listener;
}

function startSustainedAnimation() {
  stopSustainedAnimation();
  const step = () => {
    onAnimationTick?.(performance.now());
    animationHandle = requestAnimationFrame(step);
  };
  animationHandle = requestAnimationFrame(step);
}

function stopSustainedAnimation() {
  if (animationHandle != null) {
    cancelAnimationFrame(animationHandle);
    animationHandle = null;
  }
}

async function stopUiCaptureSafe(): Promise<UiFrameCaptureResult | null> {
  try {
    return await BenchNative.stopUiFrameCapture();
  } catch {
    return null;
  }
}

export async function prepareGCScenario(
  config: GCScenarioConfig,
): Promise<GCPreparedSummary> {
  if (session) {
    session.harness.dispose();
    session = null;
  }

  const harness = createHarness(config);
  const displayPeriodMs = await measureDisplayPeriodMs();

  session = { config, harness, displayPeriodMs };

  return {
    queueEntries: harness.expected.queueEntries,
    uniqueTargets: harness.expected.uniqueTargets,
  };
}

export async function runGCScenario(): Promise<GCAndroidMeasurement> {
  if (!session) {
    throw new Error(
      'prepareGCScenario() must be called before runGCScenario()',
    );
  }
  const { config, harness, displayPeriodMs } = session;
  const { policy, expected } = harness;

  harness.clearCapturedAction();

  const memBefore: MemorySnapshot = await BenchNative.getMemorySnapshot();
  const jsHeapBeforeBytes = readJsHeapBytes();

  let uiFrames: UiFrameCaptureResult | null = null;

  try {
    await BenchNative.startUiFrameCapture();
    startSustainedAnimation();

    const sequence = await runRafCollectSequence({
      collectWork: () => {
        const t0 = performance.now();
        let actionCount = 0;
        if (config.control === 'gc') {
          policy.sweep();
          const action = harness.getCapturedAction();
          actionCount = action && action.type === GC ? 1 : 0;
        }
        return {
          totalMs: performance.now() - t0,
          actionCount,
        };
      },
    });

    // Deletion accounting outside timed collect work (matches Node/browser)
    let deletionCount = 0;
    if (config.control === 'gc') {
      const remaining = countRemaining(harness.getState(), config, expected);
      deletionCount = remaining.entityDeleted + remaining.endpointDeleted;
    }

    uiFrames = await BenchNative.stopUiFrameCapture();
    validateUiFrameCapture(uiFrames);

    const frameIntervalsMs = frameIntervalsFromTimestamps(
      sequence.frameTimestamps,
    );

    const actionTargetCount =
      config.control === 'gc'
        ? expected.expectedEntitiesInAction + expected.expectedEndpointsInAction
        : 0;

    const missedFrames = excessMissedFramesFromIntervals(
      frameIntervalsMs,
      displayPeriodMs,
    );
    const maxInputDelayMs = computeMaxInputDelayMs(
      sequence.timerDelayMs,
      frameIntervalsMs,
      displayPeriodMs,
    );

    const measurement: GCAndroidMeasurement = {
      schemaVersion: 1,
      totalMs: sequence.totalMs,
      sliceDurationsMs: config.control === 'gc' ? [sequence.totalMs] : [],
      actionCount: sequence.actionCount,
      queueEntries: expected.queueEntries,
      uniqueTargets: expected.uniqueTargets,
      actionTargetCount,
      deletionCount,
      timerDelayMs: sequence.timerDelayMs,
      frameIntervalsMs,
      displayPeriodMs,
      missedFrames,
      maxInputDelayMs,
      uiCaptureSource: uiFrames.source,
      uiFrameCount: uiFrames.frameCount,
      uiMaxFrameDurationMs: uiFrames.maxFrameDurationMs,
      uiTotalFrameDurationMs: uiFrames.totalFrameDurationMs,
      uiMissedFrames: uiFrames.missedFrames,
      uiRefreshPeriodMs: uiFrames.refreshPeriodMs,
      uiRefreshRateHz: uiFrames.refreshRateHz,
    };

    validateMeasurement(config, harness, measurement);

    // Drop captured GC action arrays before heap snapshot; keep the live store.
    harness.clearCapturedAction();

    const memAfter: MemorySnapshot = await BenchNative.getMemorySnapshot();
    const jsHeapAfterBytes = readJsHeapBytes();

    measurement.processPssBeforeKb = memBefore.totalPssKb;
    measurement.processPssAfterKb = memAfter.totalPssKb;
    measurement.processPssDeltaKb = memAfter.totalPssKb - memBefore.totalPssKb;
    if (memBefore.rssKb != null) {
      measurement.processRssBeforeKb = memBefore.rssKb;
    }
    if (memAfter.rssKb != null) {
      measurement.processRssAfterKb = memAfter.rssKb;
    }
    if (memBefore.rssKb != null && memAfter.rssKb != null) {
      measurement.processRssDeltaKb = memAfter.rssKb - memBefore.rssKb;
    }
    if (jsHeapBeforeBytes != null) {
      measurement.jsHeapBeforeBytes = jsHeapBeforeBytes;
    }
    if (jsHeapAfterBytes != null) {
      measurement.jsHeapAfterBytes = jsHeapAfterBytes;
    }
    if (jsHeapBeforeBytes != null && jsHeapAfterBytes != null) {
      measurement.jsHeapDeltaBytes = jsHeapAfterBytes - jsHeapBeforeBytes;
    }

    return measurement;
  } finally {
    // Always stop animation; stop native capture only if the success path
    // did not already take the snapshot (collectWork may reject mid-sequence).
    stopSustainedAnimation();
    if (uiFrames == null) {
      await stopUiCaptureSafe();
    }
  }
}

export function disposeGCScenario(): void {
  stopSustainedAnimation();
  if (!session) return;
  session.harness.dispose();
  session = null;
}

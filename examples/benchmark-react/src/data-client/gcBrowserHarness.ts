/**
 * Isolated browser GC harness — separate from DataProvider's benchGC singleton.
 *
 * Builds a benchmark-only Controller + createReducer + timerless GCPolicy with
 * raw deterministic state, queues via createCountRef, mode=end-to-end, using
 * the fixture shared with the Node/Android harnesses (examples/gc-shared). Measures
 * real core cache GC on the main thread without 100k React components or network.
 *
 * Timing boundaries:
 *   prepare — fixtures, queue, quiet displayPeriodMs (untimed)
 *   run     — interaction probes + explicit sweep/no-op (timed); resolves after probes settle
 *   dispose — drop store/policy (after Playwright heapAfter)
 */
import {
  Controller,
  GCPolicy,
  actionTypes,
  createReducer,
  initialState,
} from '@data-client/core';
import type {
  GCBrowserMeasurement,
  GCPreparedSummary,
  GCScenarioConfig,
} from '@shared/types';

import { measureDisplayPeriodMs } from './gcInteractionMetrics';
import {
  CALIBRATION_BLOCK_MS_MAX,
  CALIBRATION_BLOCK_MS_MIN,
  runChromiumInteractionProbe,
  syntheticBlockMs,
} from './gcInteractionProbe';
import { createGCFixture } from '../../../gc-shared/gc-fixture.js';
import type { Harness } from '../../../gc-shared/gc-fixture.js';

// Destructure (not `actionTypes.GC` inline): a direct member read lets webpack
// inline the constant across chunks, which changes data-client.js bytes.
const { GC: GC_ACTION } = actionTypes;

/** Shared fixture (examples/gc-shared) bound to this app's core. */
const { createHarness, countRemaining, validateSample, GC } = createGCFixture({
  GCPolicy,
  Controller,
  createReducer,
  initialState,
  GC: GC_ACTION,
});

interface Session {
  config: GCScenarioConfig;
  harness: Harness;
  displayPeriodMs: number;
}

let session: Session | null = null;

export async function prepareGCScenario(
  config: GCScenarioConfig,
): Promise<GCPreparedSummary> {
  if (session) {
    session.harness.dispose();
    session = null;
  }

  const harness = createHarness(config, 'end-to-end');
  const displayPeriodMs = await measureDisplayPeriodMs();

  session = { config, harness, displayPeriodMs };

  return {
    queueEntries: harness.expected.queueEntries,
    uniqueTargets: harness.expected.uniqueTargets,
  };
}

/**
 * Interaction measurement via Chromium-calibrated probe:
 * rAF registers the next rAF, then setTimeout(0) runs collection post-paint
 * while a future frame is pending. See gcInteractionProbe.ts.
 * `totalMs` is sweep/no-op only (scheduling excluded).
 */
export async function runGCScenario(): Promise<GCBrowserMeasurement> {
  if (!session) {
    throw new Error(
      'prepareGCScenario() must be called before runGCScenario()',
    );
  }
  const { config, harness, displayPeriodMs } = session;
  const { policy, expected } = harness;

  harness.clearCapturedAction();

  let actionCount = 0;
  let deletionCount = 0;

  const probe = await runChromiumInteractionProbe({
    displayPeriodMs,
    work: () => {
      if (config.control === 'gc') {
        policy.sweep();
        const action = harness.getCapturedAction();
        actionCount = action && action.type === GC ? 1 : 0;
      }
    },
  });

  // Deletion accounting outside timed work
  if (config.control === 'gc') {
    const remaining = countRemaining(harness.getState(), config, expected);
    deletionCount = remaining.entityDeleted + remaining.endpointDeleted;
  }

  const actionTargetCount =
    config.control === 'gc' ?
      expected.expectedEntitiesInAction + expected.expectedEndpointsInAction
    : 0;

  const measurement: GCBrowserMeasurement = {
    schemaVersion: 1,
    totalMs: probe.totalMs,
    sliceDurationsMs: config.control === 'gc' ? [probe.totalMs] : [],
    actionCount,
    queueEntries: expected.queueEntries,
    uniqueTargets: expected.uniqueTargets,
    actionTargetCount,
    deletionCount,
    timerDelayMs: probe.timerDelayMs,
    frameIntervalsMs: probe.frameIntervalsMs,
    displayPeriodMs: probe.displayPeriodMs,
    missedFrames: probe.missedFrames,
    maxInputDelayMs: probe.maxInputDelayMs,
    longTaskCount: probe.longTaskCount,
    longTaskTotalMs: probe.longTaskTotalMs,
  };

  validateSample(config, harness, measurement, 'end-to-end', config.control);

  // Drop captured GC action arrays before Playwright heap snapshot; keep live store
  harness.clearCapturedAction();

  return measurement;
}

/**
 * Validation/calibration only: synthetic 40–50ms block through the same probe.
 * Confirms blocking spans pending frame boundaries (missedFrames / large interval).
 * Not used by GC timing scenarios.
 */
export async function calibrateGCFrameProbe(blockMs?: number): Promise<{
  blockMs: number;
  totalMs: number;
  timerDelayMs: number;
  displayPeriodMs: number;
  frameIntervalsMs: number[];
  frameIntervalMax: number;
  missedFrames: number;
  maxInputDelayMs: number;
  spannedPendingFrame: boolean;
}> {
  const displayPeriodMs =
    session?.displayPeriodMs ?? (await measureDisplayPeriodMs());
  const ms = Math.min(
    CALIBRATION_BLOCK_MS_MAX,
    Math.max(
      CALIBRATION_BLOCK_MS_MIN,
      blockMs ?? (CALIBRATION_BLOCK_MS_MIN + CALIBRATION_BLOCK_MS_MAX) / 2,
    ),
  );

  const probe = await runChromiumInteractionProbe({
    displayPeriodMs,
    work: () => syntheticBlockMs(ms),
  });

  const frameIntervalMax =
    probe.frameIntervalsMs.length > 0 ? Math.max(...probe.frameIntervalsMs) : 0;
  const spannedPendingFrame =
    probe.missedFrames >= 1 || frameIntervalMax >= displayPeriodMs * 1.5;

  return {
    blockMs: ms,
    totalMs: probe.totalMs,
    timerDelayMs: probe.timerDelayMs,
    displayPeriodMs: probe.displayPeriodMs,
    frameIntervalsMs: probe.frameIntervalsMs,
    frameIntervalMax,
    missedFrames: probe.missedFrames,
    maxInputDelayMs: probe.maxInputDelayMs,
    spannedPendingFrame,
  };
}

export function disposeGCScenario(): void {
  if (!session) return;
  session.harness.dispose();
  session = null;
}

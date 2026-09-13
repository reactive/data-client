/**
 * Isolated browser GC harness — separate from DataProvider's benchGC singleton.
 *
 * Builds a benchmark-only Controller + createReducer + timerless GCPolicy with
 * raw deterministic state, queues via createCountRef, mode=end-to-end. Measures
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
import type { State } from '@data-client/core';
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

const { GC } = actionTypes;

type EntityPath = { key: string; pk: string };

export const ENTITY_KEY = 'BenchEntity';
export const ZERO_META = Object.freeze({
  date: 0,
  fetchedAt: 0,
  expiresAt: 0,
});

/** Timerless explicit policy: no intervals; public sweep → protected runSweep. */
class BrowserBenchmarkGCPolicy extends GCPolicy {
  constructor() {
    super({ expiresAt: () => 0 });
  }

  init(controller: Controller) {
    this.controller = controller;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cleanup() {}

  sweep() {
    this.runSweep();
  }

  get entityQueueLength() {
    return this.entitiesQ.length;
  }

  get endpointQueueSize() {
    return this.endpointsQ.size;
  }

  get queueEntries() {
    return this.entityQueueLength + this.endpointQueueSize;
  }
}

interface ExpectedScalars {
  queueEntries: number;
  uniqueTargets: number;
  expectedEntitiesInAction: number;
  expectedEndpointsInAction: number;
  expectedUniqueEntityDeletions: number;
  expectedEndpointDeletions: number;
}

interface Harness {
  policy: BrowserBenchmarkGCPolicy;
  expected: ExpectedScalars;
  getState: () => State<unknown>;
  getCapturedAction: () => {
    type: string;
    entities: EntityPath[];
    endpoints: string[];
  } | null;
  clearCapturedAction: () => void;
  dispose: () => void;
}

function splitMixedCount(total: number) {
  const endpoints = Math.floor(total / 2);
  return { entities: total - endpoints, endpoints };
}

function entityPath(pk: number): EntityPath {
  return { key: ENTITY_KEY, pk: String(pk) };
}

function endpointKey(i: number) {
  return `bench-endpoint-${i}`;
}

function buildEntityState(count: number): State<unknown> {
  const entities = { [ENTITY_KEY]: {} as Record<string, { id: string }> };
  const entitiesMeta = {
    [ENTITY_KEY]: {} as Record<string, typeof ZERO_META>,
  };
  for (let i = 0; i < count; i++) {
    const pk = String(i);
    entities[ENTITY_KEY][pk] = { id: pk };
    entitiesMeta[ENTITY_KEY][pk] = { ...ZERO_META };
  }
  return { ...initialState, entities, entitiesMeta };
}

function buildEndpointState(count: number): State<unknown> {
  const endpoints: Record<string, string> = {};
  const meta: Record<string, typeof ZERO_META> = {};
  for (let i = 0; i < count; i++) {
    const key = endpointKey(i);
    endpoints[key] = String(i);
    meta[key] = { ...ZERO_META };
  }
  return { ...initialState, endpoints, meta };
}

function buildMixedState(
  entityCount: number,
  endpointCount: number,
): State<unknown> {
  const entities = buildEntityState(entityCount);
  const endpoints = buildEndpointState(endpointCount);
  return {
    ...entities,
    endpoints: endpoints.endpoints,
    meta: endpoints.meta,
  };
}

function buildStateForSpec(config: GCScenarioConfig): State<unknown> {
  const { candidateKind, pattern, count } = config;
  if (pattern === 'duplicate') return buildEntityState(1);
  if (candidateKind === 'entity') return buildEntityState(count);
  if (candidateKind === 'endpoint') return buildEndpointState(count);
  if (candidateKind === 'mixed') {
    const { entities, endpoints } = splitMixedCount(count);
    return buildMixedState(entities, endpoints);
  }
  throw new Error(`unknown candidateKind: ${candidateKind}`);
}

function queueCandidates(
  policy: BrowserBenchmarkGCPolicy,
  config: GCScenarioConfig,
): ExpectedScalars {
  const { candidateKind, pattern, count } = config;

  if (pattern === 'duplicate') {
    if (candidateKind !== 'entity') {
      throw new Error(
        `duplicate pattern only supports candidateKind=entity (got ${candidateKind})`,
      );
    }
    const path = entityPath(0);
    const countRef = policy.createCountRef({ paths: [path] });
    for (let i = 0; i < count; i++) {
      const release = countRef();
      release();
    }
    return {
      queueEntries: count,
      uniqueTargets: 1,
      expectedEntitiesInAction: count,
      expectedEndpointsInAction: 0,
      expectedUniqueEntityDeletions: 1,
      expectedEndpointDeletions: 0,
    };
  }

  if (candidateKind === 'entity') {
    for (let i = 0; i < count; i++) {
      const release = policy.createCountRef({ paths: [entityPath(i)] })();
      release();
    }
    return {
      queueEntries: count,
      uniqueTargets: count,
      expectedEntitiesInAction: count,
      expectedEndpointsInAction: 0,
      expectedUniqueEntityDeletions: count,
      expectedEndpointDeletions: 0,
    };
  }

  if (candidateKind === 'endpoint') {
    for (let i = 0; i < count; i++) {
      const release = policy.createCountRef({ key: endpointKey(i) })();
      release();
    }
    return {
      queueEntries: count,
      uniqueTargets: count,
      expectedEntitiesInAction: 0,
      expectedEndpointsInAction: count,
      expectedUniqueEntityDeletions: 0,
      expectedEndpointDeletions: count,
    };
  }

  if (candidateKind === 'mixed') {
    const { entities, endpoints } = splitMixedCount(count);
    for (let i = 0; i < entities; i++) {
      const release = policy.createCountRef({ paths: [entityPath(i)] })();
      release();
    }
    for (let i = 0; i < endpoints; i++) {
      const release = policy.createCountRef({ key: endpointKey(i) })();
      release();
    }
    return {
      queueEntries: count,
      uniqueTargets: count,
      expectedEntitiesInAction: entities,
      expectedEndpointsInAction: endpoints,
      expectedUniqueEntityDeletions: entities,
      expectedEndpointDeletions: endpoints,
    };
  }

  throw new Error(`unknown candidateKind: ${candidateKind}`);
}

/** End-to-end harness: sweep dispatches and reduces synchronously. */
function createHarness(config: GCScenarioConfig): Harness {
  const state = buildStateForSpec(config);
  const policy = new BrowserBenchmarkGCPolicy();
  const controller = new Controller({ gcPolicy: policy });
  const reducer = createReducer(controller);

  let capturedAction: {
    type: string;
    entities: EntityPath[];
    endpoints: string[];
  } | null = null;
  let workingState: State<unknown> = state;

  controller.getState = () => workingState;
  controller.dispatch = ((action: any) => {
    capturedAction = action;
    workingState = reducer(workingState, action);
  }) as typeof controller.dispatch;

  policy.init(controller);
  const expected = queueCandidates(policy, config);

  if (policy.queueEntries !== expected.queueEntries) {
    throw new Error(
      `fixture queue cardinality ${policy.queueEntries} !== expected ${expected.queueEntries}`,
    );
  }

  return {
    policy,
    expected,
    getState: () => workingState,
    getCapturedAction: () => capturedAction,
    clearCapturedAction() {
      capturedAction = null;
    },
    dispose() {
      capturedAction = null;
      controller.getState = () => initialState;
      controller.dispatch = (() =>
        Promise.resolve()) as typeof controller.dispatch;
      policy.cleanup();
    },
  };
}

function countRemaining(
  state: State<unknown>,
  config: GCScenarioConfig,
  expected: ExpectedScalars,
) {
  const bucket = state.entities?.[ENTITY_KEY];
  const entityRemaining = bucket ? Object.keys(bucket).length : 0;
  const endpointRemaining =
    state.endpoints ? Object.keys(state.endpoints).length : 0;

  const startedEntities =
    config.pattern === 'duplicate' ? 1 : expected.expectedUniqueEntityDeletions;
  const startedEndpoints = expected.expectedEndpointDeletions;

  return {
    entityDeleted: startedEntities - entityRemaining,
    endpointDeleted: startedEndpoints - endpointRemaining,
    entityRemaining,
    endpointRemaining,
  };
}

function validateMeasurement(
  config: GCScenarioConfig,
  harness: Harness,
  sample: Pick<
    GCBrowserMeasurement,
    | 'actionCount'
    | 'deletionCount'
    | 'queueEntries'
    | 'uniqueTargets'
    | 'actionTargetCount'
  >,
) {
  const { expected, policy, getCapturedAction, getState } = harness;

  if (config.control === 'no-gc') {
    if (sample.actionCount !== 0) {
      throw new Error(
        `no-gc control expected actionCount 0, got ${sample.actionCount}`,
      );
    }
    if (sample.deletionCount !== 0) {
      throw new Error(
        `no-gc control expected deletionCount 0, got ${sample.deletionCount}`,
      );
    }
    return;
  }

  if (sample.queueEntries !== expected.queueEntries) {
    throw new Error(
      `queueEntries ${sample.queueEntries} !== expected ${expected.queueEntries}`,
    );
  }
  if (sample.uniqueTargets !== expected.uniqueTargets) {
    throw new Error(
      `uniqueTargets ${sample.uniqueTargets} !== expected ${expected.uniqueTargets}`,
    );
  }

  const actionTargetCount =
    expected.expectedEntitiesInAction + expected.expectedEndpointsInAction;
  if (sample.actionTargetCount !== actionTargetCount) {
    throw new Error(
      `actionTargetCount ${sample.actionTargetCount} !== expected ${actionTargetCount}`,
    );
  }

  const action = getCapturedAction();
  if (!action || action.type !== GC) {
    throw new Error('expected a GC action to be dispatched');
  }
  if (action.entities.length !== expected.expectedEntitiesInAction) {
    throw new Error(
      `action.entities.length ${action.entities.length} !== ${expected.expectedEntitiesInAction}`,
    );
  }
  if (action.endpoints.length !== expected.expectedEndpointsInAction) {
    throw new Error(
      `action.endpoints.length ${action.endpoints.length} !== ${expected.expectedEndpointsInAction}`,
    );
  }
  if (config.pattern === 'duplicate') {
    const unique = new Set(action.entities.map(p => `${p.key}:${p.pk}`));
    if (unique.size !== 1) {
      throw new Error(
        `duplicate pattern expected 1 unique entity path in action, got ${unique.size}`,
      );
    }
  }

  const expectedDeletions =
    expected.expectedUniqueEntityDeletions + expected.expectedEndpointDeletions;
  if (sample.deletionCount !== expectedDeletions) {
    throw new Error(
      `deletionCount ${sample.deletionCount} !== expected ${expectedDeletions}`,
    );
  }
  const remaining = countRemaining(getState(), config, expected);
  if (remaining.entityRemaining !== 0 || remaining.endpointRemaining !== 0) {
    throw new Error(
      `expected empty GC targets after deletion; remaining entities=${remaining.entityRemaining} endpoints=${remaining.endpointRemaining}`,
    );
  }
  if (policy.queueEntries !== 0) {
    throw new Error(
      `expected empty queues after sweep, got ${policy.queueEntries}`,
    );
  }
}

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

  const harness = createHarness(config);
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

  validateMeasurement(config, harness, measurement);

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

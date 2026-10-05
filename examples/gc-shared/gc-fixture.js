'use strict';
/**
 * Deterministic GC fixtures shared by the Node, browser, and Android GC harnesses.
 *
 * Builds state + candidate queues outside timed work. Fixtures match
 * entities/entitiesMeta and endpoints/meta so sweeps are eligible immediately
 * under BenchmarkGCPolicy (expiresAt → 0).
 *
 * CommonJS on purpose (see ./README.md). `@data-client/core` is injected via
 * createGCFixture() so each harness supplies its own build of core (Node: the
 * webpack dist bundle; browser/Android: the package source).
 */
const { splitMixedCount } = require('./protocol.js');

const ENTITY_KEY = 'BenchEntity';
const ZERO_META = Object.freeze({
  date: 0,
  fetchedAt: 0,
  expiresAt: 0,
});

function entityPath(pk) {
  return { key: ENTITY_KEY, pk: String(pk) };
}

function endpointKey(i) {
  return `bench-endpoint-${i}`;
}

/** Scalar expectations only — no retained path/key arrays (avoids observer heap). */
function expectedScalars(overrides) {
  return {
    queueEntries: overrides.queueEntries,
    uniqueTargets: overrides.uniqueTargets,
    expectedEntitiesInAction: overrides.expectedEntitiesInAction,
    expectedEndpointsInAction: overrides.expectedEndpointsInAction,
    expectedUniqueEntityDeletions: overrides.expectedUniqueEntityDeletions,
    expectedEndpointDeletions: overrides.expectedEndpointDeletions,
  };
}

/**
 * Queue candidates via createCountRef mount/release (outside timed work).
 * Duplicate pattern repeatedly releases one entity path.
 * Does not retain parallel target arrays — callers that need a prebuilt GC
 * action use buildPrebuiltAction().
 */
function queueCandidates(policy, spec) {
  const { candidateKind, pattern, count } = spec;

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
    return expectedScalars({
      queueEntries: count,
      uniqueTargets: 1,
      expectedEntitiesInAction: count,
      expectedEndpointsInAction: 0,
      expectedUniqueEntityDeletions: 1,
      expectedEndpointDeletions: 0,
    });
  }

  if (candidateKind === 'entity') {
    for (let i = 0; i < count; i++) {
      const release = policy.createCountRef({ paths: [entityPath(i)] })();
      release();
    }
    return expectedScalars({
      queueEntries: count,
      uniqueTargets: count,
      expectedEntitiesInAction: count,
      expectedEndpointsInAction: 0,
      expectedUniqueEntityDeletions: count,
      expectedEndpointDeletions: 0,
    });
  }

  if (candidateKind === 'endpoint') {
    for (let i = 0; i < count; i++) {
      const release = policy.createCountRef({ key: endpointKey(i) })();
      release();
    }
    return expectedScalars({
      queueEntries: count,
      uniqueTargets: count,
      expectedEntitiesInAction: 0,
      expectedEndpointsInAction: count,
      expectedUniqueEntityDeletions: 0,
      expectedEndpointDeletions: count,
    });
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
    return expectedScalars({
      queueEntries: count,
      uniqueTargets: count,
      expectedEntitiesInAction: entities,
      expectedEndpointsInAction: endpoints,
      expectedUniqueEntityDeletions: entities,
      expectedEndpointDeletions: endpoints,
    });
  }

  throw new Error(`unknown candidateKind: ${candidateKind}`);
}

/** Count deletions vs. fixture after a destructive GC apply. */
function countRemaining(state, spec, expected) {
  const bucket = state.entities?.[ENTITY_KEY];
  const entityRemaining = bucket ? Object.keys(bucket).length : 0;
  const endpointRemaining =
    state.endpoints ? Object.keys(state.endpoints).length : 0;

  // unique/mixed start with expectedUniqueEntityDeletions entities; duplicate starts with 1
  const startedEntities =
    spec.pattern === 'duplicate' ? 1 : expected.expectedUniqueEntityDeletions;
  const startedEndpoints = expected.expectedEndpointDeletions;

  return {
    entityDeleted: startedEntities - entityRemaining,
    endpointDeleted: startedEndpoints - endpointRemaining,
    entityRemaining,
    endpointRemaining,
  };
}

/**
 * Bind the fixture to one build of `@data-client/core`.
 *
 * Takes named pieces (not the module namespace) so bundlers can tree-shake
 * the caller's core import.
 */
function createGCFixture({
  GCPolicy,
  Controller,
  createReducer,
  initialState,
  GC,
}) {
  /** Timerless explicit policy: no intervals/idleness; one-shot public sweep. */
  class BenchmarkGCPolicy extends GCPolicy {
    constructor() {
      super({ expiresAt: () => 0 });
    }

    init(controller) {
      this.controller = controller;
    }

    cleanup() {}

    /** Public one-shot entry that calls the protected monolithic runSweep. */
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

  /** Build store state with matching entities + entitiesMeta. */
  function buildEntityState(count) {
    const entities = { [ENTITY_KEY]: {} };
    const entitiesMeta = { [ENTITY_KEY]: {} };
    for (let i = 0; i < count; i++) {
      const pk = String(i);
      entities[ENTITY_KEY][pk] = { id: pk };
      entitiesMeta[ENTITY_KEY][pk] = { ...ZERO_META };
    }
    return {
      ...initialState,
      entities,
      entitiesMeta,
    };
  }

  /** Build store state with matching endpoints + meta. */
  function buildEndpointState(count) {
    const endpoints = {};
    const meta = {};
    for (let i = 0; i < count; i++) {
      const key = endpointKey(i);
      endpoints[key] = String(i);
      meta[key] = { ...ZERO_META };
    }
    return {
      ...initialState,
      endpoints,
      meta,
    };
  }

  /** Mixed state: entityCount distinct entities + endpointCount distinct endpoints. */
  function buildMixedState(entityCount, endpointCount) {
    const state = buildEntityState(entityCount);
    const endpoints = {};
    const meta = {};
    for (let i = 0; i < endpointCount; i++) {
      const key = endpointKey(i);
      endpoints[key] = String(i);
      meta[key] = { ...ZERO_META };
    }
    return { ...state, endpoints, meta };
  }

  /** Build a GC action for reducer mode only (scan/e2e get targets from sweep). */
  function buildPrebuiltAction(spec) {
    const { candidateKind, pattern, count } = spec;

    if (pattern === 'duplicate') {
      const path = entityPath(0);
      return {
        type: GC,
        entities: Array.from({ length: count }, () => ({ ...path })),
        endpoints: [],
      };
    }

    if (candidateKind === 'entity') {
      return {
        type: GC,
        entities: Array.from({ length: count }, (_, i) => entityPath(i)),
        endpoints: [],
      };
    }

    if (candidateKind === 'endpoint') {
      return {
        type: GC,
        entities: [],
        endpoints: Array.from({ length: count }, (_, i) => endpointKey(i)),
      };
    }

    if (candidateKind === 'mixed') {
      const { entities, endpoints } = splitMixedCount(count);
      return {
        type: GC,
        entities: Array.from({ length: entities }, (_, i) => entityPath(i)),
        endpoints: Array.from({ length: endpoints }, (_, i) => endpointKey(i)),
      };
    }

    throw new Error(`unknown candidateKind: ${candidateKind}`);
  }

  function buildStateForSpec(spec) {
    const { candidateKind, pattern, count } = spec;
    if (pattern === 'duplicate') {
      return buildEntityState(1);
    }
    if (candidateKind === 'entity') return buildEntityState(count);
    if (candidateKind === 'endpoint') return buildEndpointState(count);
    if (candidateKind === 'mixed') {
      const { entities, endpoints } = splitMixedCount(count);
      return buildMixedState(entities, endpoints);
    }
    throw new Error(`unknown candidateKind: ${candidateKind}`);
  }

  /**
   * Wire a Controller + BenchmarkGCPolicy for the given mode.
   * - scan: dispatch captures action only; no prebuilt action arrays
   * - end-to-end: dispatch reduces; no prebuilt action arrays
   * - reducer: prebuilt GC action only (needed for timed reducer path)
   */
  function createHarness(spec, mode) {
    const state = buildStateForSpec(spec);
    const policy = new BenchmarkGCPolicy();
    const controller = new Controller({ gcPolicy: policy });
    const reducer = createReducer(controller);

    let capturedAction = null;
    let workingState = state;
    /** Seed retained only until reducer takes it (then nulled). */
    let seedState = mode === 'reducer' ? state : null;

    controller.getState = () => workingState;

    if (mode === 'scan') {
      controller.dispatch = action => {
        capturedAction = action;
      };
    } else if (mode === 'end-to-end') {
      controller.dispatch = action => {
        capturedAction = action;
        workingState = reducer(workingState, action);
      };
    } else if (mode === 'reducer') {
      // Reducer mode does not sweep; dispatch unused during timed work
      controller.dispatch = action => {
        capturedAction = action;
      };
    } else {
      throw new Error(`unknown harness mode: ${mode}`);
    }

    policy.init(controller);
    const expected = queueCandidates(policy, spec);

    if (policy.queueEntries !== expected.queueEntries) {
      throw new Error(
        `fixture queue cardinality ${policy.queueEntries} !== expected ${expected.queueEntries}`,
      );
    }

    // Only reducer needs a prebuilt action; scan/e2e would duplicate 100k target arrays
    let prebuiltAction = mode === 'reducer' ? buildPrebuiltAction(spec) : null;

    const harness = {
      policy,
      reducer,
      expected,
      get prebuiltAction() {
        return prebuiltAction;
      },
      getState: () => workingState,
      getCapturedAction: () => capturedAction,
      clearCapturedAction() {
        capturedAction = null;
      },
      /**
       * Drop observer-only refs (captured action, prebuilt action) while keeping
       * the live store + policy for retained-cache heap measurement.
       */
      releaseObserverRefs() {
        capturedAction = null;
        prebuiltAction = null;
        seedState = null;
      },
      /**
       * Reducer: hand the freshly built seed to the reducer and drop the seed
       * ref. The fixture is built per harness, so there is nothing to protect
       * by cloning.
       */
      takeReducerState() {
        if (!seedState) {
          throw new Error(
            'takeReducerState() requires reducer mode with a seed',
          );
        }
        workingState = seedState;
        seedState = null;
        return workingState;
      },
      /** Drop store/policy/controller so a later V8 GC can reclaim everything. */
      dispose() {
        capturedAction = null;
        prebuiltAction = null;
        seedState = null;
        workingState = initialState;
        controller.getState = () => initialState;
        controller.dispatch = () => Promise.resolve();
        policy.cleanup();
      },
    };

    return harness;
  }

  /**
   * Validate an accepted sample against fixture expectations.
   * Throws on invalid fixture/result.
   */
  function validateSample(spec, harness, sampleMetrics, mode, control) {
    const { expected, policy, getCapturedAction, getState } = harness;

    if (control === 'no-gc') {
      if (sampleMetrics.actionCount !== 0) {
        throw new Error(
          `no-gc control expected actionCount 0, got ${sampleMetrics.actionCount}`,
        );
      }
      if (sampleMetrics.deletionCount !== 0) {
        throw new Error(
          `no-gc control expected deletionCount 0, got ${sampleMetrics.deletionCount}`,
        );
      }
      return;
    }

    if (sampleMetrics.queueEntries !== expected.queueEntries) {
      throw new Error(
        `queueEntries ${sampleMetrics.queueEntries} !== expected ${expected.queueEntries}`,
      );
    }
    if (sampleMetrics.uniqueTargets !== expected.uniqueTargets) {
      throw new Error(
        `uniqueTargets ${sampleMetrics.uniqueTargets} !== expected ${expected.uniqueTargets}`,
      );
    }

    const actionTargetCount =
      expected.expectedEntitiesInAction + expected.expectedEndpointsInAction;
    if (sampleMetrics.actionTargetCount !== actionTargetCount) {
      throw new Error(
        `actionTargetCount ${sampleMetrics.actionTargetCount} !== expected ${actionTargetCount}`,
      );
    }

    if (mode === 'scan' || mode === 'end-to-end') {
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
      if (spec.pattern === 'duplicate') {
        const unique = new Set(action.entities.map(p => `${p.key}:${p.pk}`));
        if (unique.size !== 1) {
          throw new Error(
            `duplicate pattern expected 1 unique entity path in action, got ${unique.size}`,
          );
        }
      }
    }

    if (mode === 'reducer' || mode === 'end-to-end') {
      const expectedDeletions =
        expected.expectedUniqueEntityDeletions +
        expected.expectedEndpointDeletions;
      if (sampleMetrics.deletionCount !== expectedDeletions) {
        throw new Error(
          `deletionCount ${sampleMetrics.deletionCount} !== expected ${expectedDeletions}`,
        );
      }
      const remaining = countRemaining(getState(), spec, expected);
      if (
        remaining.entityRemaining !== 0 ||
        remaining.endpointRemaining !== 0
      ) {
        throw new Error(
          `expected empty GC targets after deletion; remaining entities=${remaining.entityRemaining} endpoints=${remaining.endpointRemaining}`,
        );
      }
    }

    if (mode === 'scan' && sampleMetrics.deletionCount !== 0) {
      throw new Error(
        `scan mode must not delete; got ${sampleMetrics.deletionCount}`,
      );
    }

    // After a successful sweep, queues should be drained (gc path).
    if (
      (mode === 'scan' || mode === 'end-to-end') &&
      policy.queueEntries !== 0
    ) {
      throw new Error(
        `expected empty queues after sweep, got ${policy.queueEntries}`,
      );
    }
  }

  return {
    ENTITY_KEY,
    ZERO_META,
    BenchmarkGCPolicy,
    buildEntityState,
    buildEndpointState,
    buildMixedState,
    buildStateForSpec,
    queueCandidates,
    buildPrebuiltAction,
    createHarness,
    countRemaining,
    validateSample,
    GC,
  };
}

module.exports = {
  ENTITY_KEY,
  ZERO_META,
  queueCandidates,
  countRemaining,
  createGCFixture,
};

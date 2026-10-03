/**
 * Node GC harness binding of the shared fixture/protocol (examples/gc-shared)
 * to the webpack-built core in ./dist (not `@data-client/core` source).
 */
import {
  GCPolicy,
  Controller,
  createReducer,
  initialState,
  actionTypes,
} from './dist/index.js';
import { createGCFixture } from '../gc-shared/gc-fixture.js';
import { listScenarios as listSharedScenarios } from '../gc-shared/protocol.js';

export const {
  ENTITY_KEY,
  ZERO_META,
  BenchmarkGCPolicy,
  buildEntityState,
  buildEndpointState,
  buildMixedState,
  queueCandidates,
  buildPrebuiltAction,
  createHarness,
  countRemaining,
  validateSample,
  GC,
} = createGCFixture({
  GCPolicy,
  Controller,
  createReducer,
  initialState,
  GC: actionTypes.GC,
});

/**
 * Node scenario descriptors (count → kind → mode → control, then the entity
 * duplicate baseline per count). Fixtures are not built here, so filtering a
 * single 100k case never constructs unrelated stores.
 *
 * @param {string} [filter] slash-bounded segments or ^prefix against the id
 * @returns {Array<object>} `{ id, platform, candidateKind, pattern, count, mode, control }`
 */
export function listScenarios(filter) {
  return listSharedScenarios('node', { filter });
}

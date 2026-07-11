import { Controller, createReducer } from './dist/index.js';
import { createMatcher } from './filter.js';
import {
  buildLargeEntityState,
  buildManyEndpointsState,
  buildCollectionState,
  buildFlatItemData,
  getFlatItem,
  getControlItem,
  pushFlatItems,
} from './schemas.js';

/** Controller whose dispatches run the reducer against a fixed baseline state
 * without persisting, so every op measures the same degenerate write. */
function createStaticController(state) {
  const controller = new Controller({});
  const reducer = createReducer(controller);
  controller.dispatch = action => {
    reducer(state, action);
  };
  return controller;
}

/** Memoizes fixture construction so scenarios sharing a fixture (and repeat
 * buildScenarios() calls) only build it once. */
function lazy(build) {
  let value;
  return () => (value ??= build());
}

const ctrl1k = lazy(() => createStaticController(buildLargeEntityState(1_000)));
const ctrl10k = lazy(() =>
  createStaticController(buildLargeEntityState(10_000)),
);
const ctrl100k = lazy(() =>
  createStaticController(buildLargeEntityState(100_000)),
);
const ctrlEndpoints = lazy(() =>
  createStaticController(buildManyEndpointsState(10_000)),
);
const ctrlCollection = lazy(() =>
  createStaticController(buildCollectionState(10_000)),
);

// websocket-tick style partial update to an existing entity
const tick = { id: 'f-500', value: 42, updatedAt: 1700000000001 };
const tickArgs = { id: 'f-500' };
const controlTick = { id: 'c-5', name: 'Control tick' };
const controlArgs = { id: 'c-5' };
const invalidateAllOptions = { testKey: () => true };

/**
 * Degenerate-case write scenarios exercising the spread operations whose cost
 * scales with store size rather than payload size:
 *
 * - setOneEntity sweep: per-entity-type map clone in NormalizeDelegate
 *   (entities[key] + entitiesMeta[key] copied on first write to a type)
 * - control write: same store, small entity type — confirms cost is per-type
 * - cached endpoints: { ...state.endpoints } / { ...state.meta } in
 *   setResponseReducer, O(distinct cached endpoint keys) per fetch
 * - collection push: pushMerge [...existing, ...incoming], O(collection size)
 * - invalidateAll/expireAll: full endpoints/meta copies
 *
 * `create()` builds the scenario's fixtures and returns the op to measure.
 */
const scenarios = [
  {
    name: 'setOneEntity in 1k entity store',
    iterations: 5000,
    create() {
      const ctrl = ctrl1k();
      return () => ctrl.setResponse(getFlatItem, tickArgs, tick);
    },
  },
  {
    name: 'setOneEntity in 10k entity store',
    iterations: 1000,
    create() {
      const ctrl = ctrl10k();
      return () => ctrl.setResponse(getFlatItem, tickArgs, tick);
    },
  },
  {
    name: 'setOneEntity in 100k entity store',
    iterations: 200,
    create() {
      const ctrl = ctrl100k();
      return () => ctrl.setResponse(getFlatItem, tickArgs, tick);
    },
  },
  {
    name: 'setOneEntity control in 100k entity store',
    iterations: 5000,
    create() {
      const ctrl = ctrl100k();
      return () => ctrl.setResponse(getControlItem, controlArgs, controlTick);
    },
  },
  {
    name: 'setOneEntity with 10k cached endpoints',
    iterations: 1000,
    create() {
      const ctrl = ctrlEndpoints();
      return () => ctrl.setResponse(getControlItem, controlArgs, controlTick);
    },
  },
  {
    name: 'collection push 10 onto 10k',
    iterations: 1000,
    create() {
      const ctrl = ctrlCollection();
      const pushedItems = buildFlatItemData(10, 1_000_000);
      return () => ctrl.setResponse(pushFlatItems, pushedItems);
    },
  },
  {
    name: 'invalidateAll 10k endpoints',
    iterations: 500,
    create() {
      const ctrl = ctrlEndpoints();
      return () => ctrl.invalidateAll(invalidateAllOptions);
    },
  },
  {
    name: 'expireAll 10k endpoints',
    iterations: 500,
    create() {
      const ctrl = ctrlEndpoints();
      return () => ctrl.expireAll(invalidateAllOptions);
    },
  },
];

/**
 * Builds only the scenarios matching `filter` (same syntax as suite filters:
 * substring, or `^prefix`), so unmatched fixtures are never constructed.
 *
 * Shared by the `spread` Benchmark.js suite (throughput) and memory.js
 * (allocation/GC pressure). `iterations` is only used by memory.js.
 *
 * @param {string} [filter]
 * @returns {Array<{name: string, fn: () => void, iterations: number}>}
 */
export function buildScenarios(filter) {
  const match = createMatcher(filter);
  return scenarios
    .filter(({ name }) => match(name))
    .map(({ name, iterations, create }) => ({
      name,
      iterations,
      fn: create(),
    }));
}

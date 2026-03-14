/**
 * Ref-stability report: counts of components that kept vs received new refs after an update.
 * Smaller "changed" counts = better (normalization keeps referential equality for unchanged entities).
 */
export interface RefStabilityReport {
  itemRefUnchanged: number;
  itemRefChanged: number;
  authorRefUnchanged: number;
  authorRefChanged: number;
}

/**
 * Benchmark API interface exposed by each library app on window.__BENCH__
 */
export interface BenchAPI {
  /** Show a ListView that auto-fetches count items. Measures fetch + normalization + render pipeline. */
  init(count: number): void;
  updateEntity(id: string): void;
  updateAuthor(id: string): void;
  /** Set simulated per-request network latency (ms). 0 disables and flushes pending delays. */
  setNetworkDelay(ms: number): void;
  unmountAll(): void;
  getRenderedCount(): number;
  captureRefSnapshot(): void;
  getRefStabilityReport(): RefStabilityReport;
  /** Legacy ids-based mount; optional — prefer init. */
  mount?(count: number): void;
  /** For memory scenarios: mount n items, unmount, repeat cycles times; resolves when done. */
  mountUnmountCycle?(count: number, cycles: number): Promise<void>;
  /** Optimistic update via getOptimisticResponse; sets data-bench-complete when painted. data-client only. */
  optimisticUpdate?(): void;
  /** Mount a sorted/derived view of items. Exercises Query memoization (data-client) vs useMemo sort (others). */
  mountSortedView?(count: number): void;
  /** Invalidate a cached endpoint and immediately re-resolve. Measures Suspense round-trip. data-client only. */
  invalidateAndResolve?(id: string): void;
  /** Create a new item via mutation endpoint. */
  createEntity?(): void;
  /** Delete an existing item via mutation endpoint. */
  deleteEntity?(id: string): void;
}

declare global {
  interface Window {
    __BENCH__?: BenchAPI;
  }
}

export interface Author {
  id: string;
  login: string;
  name: string;
}

export interface Item {
  id: string;
  label: string;
  author: Author;
}

export type ScenarioAction =
  | { action: 'init'; args: [number] }
  | { action: 'updateEntity'; args: [string] }
  | { action: 'updateAuthor'; args: [string] }
  | { action: 'unmountAll'; args: [] }
  | { action: 'createEntity'; args: [] }
  | { action: 'deleteEntity'; args: [string] };

export type ResultMetric =
  | 'duration'
  | 'itemRefChanged'
  | 'authorRefChanged'
  | 'heapDelta';

/** hotPath = JS only, included in CI. withNetwork = simulated network/overfetching, comparison only. memory = heap delta, not CI. startup = page load metrics, not CI. */
export type ScenarioCategory = 'hotPath' | 'withNetwork' | 'memory' | 'startup';

/** small = cheap scenarios (full warmup + measurement). large = expensive scenarios (reduced runs). */
export type ScenarioSize = 'small' | 'large';

export interface Scenario {
  name: string;
  action: keyof BenchAPI;
  args: unknown[];
  /** Which value to report; default 'duration'. Ref-stability use itemRefChanged/authorRefChanged; memory use heapDelta. */
  resultMetric?: ResultMetric;
  /** hotPath (default) = run in CI. withNetwork = comparison only. memory = heap delta. startup = page load metrics. */
  category?: ScenarioCategory;
  /** small (default) = full runs. large = reduced warmup/measurement for expensive scenarios. */
  size?: ScenarioSize;
  /** For update scenarios: number of items to mount before running the update (default 100). */
  mountCount?: number;
  /** Use a different BenchAPI method to pre-mount (e.g. 'mountSortedView' instead of 'mount'). */
  preMountAction?: keyof BenchAPI;
  /** Simulated per-request network latency in ms (applied at the server layer). */
  networkDelayMs?: number;
  /** Result is deterministic (zero variance); run exactly once with no warmup. */
  deterministic?: boolean;
}

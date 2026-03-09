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
 * Options for updateAuthor when simulating network (for comparison scenarios).
 * Consistent delay so results are comparable across libraries.
 */
export interface UpdateAuthorOptions {
  /** Simulated delay per "request" in ms (e.g. 50). */
  simulateNetworkDelayMs?: number;
  /** Number of simulated round-trips (data-client = 1; non-normalized libs may need more). */
  simulatedRequestCount?: number;
}

/**
 * Benchmark API interface exposed by each library app on window.__BENCH__
 */
export interface BenchAPI {
  mount(count: number): void;
  updateEntity(id: string): void;
  updateAuthor(id: string, options?: UpdateAuthorOptions): void;
  unmountAll(): void;
  getRenderedCount(): number;
  captureRefSnapshot(): void;
  getRefStabilityReport(): RefStabilityReport;
  /** For memory scenarios: mount n items, unmount, repeat cycles times; resolves when done. */
  mountUnmountCycle?(count: number, cycles: number): Promise<void>;
  /** Optimistic update then rollback; sets data-bench-complete when rollback is painted. Optional (data-client only). */
  optimisticRollback?(): void;
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
  | { action: 'mount'; args: [number] }
  | { action: 'updateEntity'; args: [string] }
  | { action: 'updateAuthor'; args: [string] }
  | { action: 'updateAuthor'; args: [string, UpdateAuthorOptions] }
  | { action: 'unmountAll'; args: [] };

export type ResultMetric =
  | 'duration'
  | 'itemRefChanged'
  | 'authorRefChanged'
  | 'heapDelta';

/** hotPath = JS only, included in CI. withNetwork = simulated network/overfetching, comparison only. memory = heap delta, not CI. */
export type ScenarioCategory = 'hotPath' | 'withNetwork' | 'memory';

export interface Scenario {
  name: string;
  action: keyof BenchAPI;
  args: unknown[];
  /** Which value to report; default 'duration'. Ref-stability use itemRefChanged/authorRefChanged; memory use heapDelta. */
  resultMetric?: ResultMetric;
  /** hotPath (default) = run in CI. withNetwork = comparison only. memory = heap delta. */
  category?: ScenarioCategory;
  /** For update scenarios: number of items to mount before running the update (default 100). */
  mountCount?: number;
}

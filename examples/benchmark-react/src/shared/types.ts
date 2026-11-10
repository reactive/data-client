/**
 * Ref-stability report: counts of components that kept vs received new refs after an update.
 * Smaller "changed" counts = better (normalization keeps referential equality for unchanged entities).
 */
export interface RefStabilityReport {
  issueRefUnchanged: number;
  issueRefChanged: number;
  userRefUnchanged: number;
  userRefChanged: number;
}

/** Component render counts since the last `resetRenderCounts()`. */
export interface RenderCounts {
  /** IssueRow renders. 0 = no row re-rendered. */
  issueRowRenders: number;
  /** ListView renders. With issueRowRenders 0, shows the list re-rendered but skipped its rows. */
  listViewRenders: number;
}

/**
 * Benchmark API interface exposed by each library app on window.__BENCH__
 */
export interface BenchAPI {
  /** Show a ListView that auto-fetches count issues. Measures fetch + normalization + render pipeline. */
  init(count: number): void;
  updateEntity(id: number): void;
  updateUser(login: string): void;
  /** Set simulated per-request network latency (ms). 0 disables and clears network sim. */
  setNetworkDelay(ms: number): void;
  /** Enable/disable response-size-based network simulation. Delay = baseLatencyMs + ceil(recordCount / recordsPerMs). Pass null to disable. */
  setNetworkSim(
    config: { baseLatencyMs: number; recordsPerMs: number } | null,
  ): void;
  /** Wait for all deferred server mutations to settle before next iteration. */
  flushPendingMutations(): Promise<void>;
  unmountAll(): void;
  getRenderedCount(): number;
  captureRefSnapshot(): void;
  getRefStabilityReport(): RefStabilityReport;
  resetRenderCounts(): void;
  getRenderCounts(): RenderCounts;
  /** Legacy ids-based mount; optional — prefer init. */
  mount?(count: number): void;
  /** For memory scenarios: mount n issues, unmount, repeat cycles times; resolves when done. */
  mountUnmountCycle?(count: number, cycles: number): Promise<void>;
  /** Mount a sorted/derived view of issues. Exercises Query memoization (data-client) vs useMemo sort (others). */
  mountSortedView?(count: number): void;
  /** Invalidate a cached endpoint and immediately re-resolve. Measures Suspense round-trip. data-client only. */
  invalidateAndResolve?(id: number): void;
  /** Prepend a new issue via mutation endpoint. */
  unshiftItem?(): void;
  /** Delete an existing issue via mutation endpoint. */
  deleteEntity?(id: number): void;
  /** Mount two side-by-side lists filtered by state ('open', 'closed'). */
  initDoubleList?(count: number): void;
  /** Move an issue from one state-filtered list to another. Exercises Collection.move (data-client) vs invalidate+refetch (others). */
  moveItem?(id: number): void;
  /** Switch between sorted list view and individual issue detail views. Exercises normalized cache lookup (data-client) vs per-navigation fetch (others). */
  listDetailSwitch?(navigations: number, seedCount: number): Promise<void>;
  /** Per round: create an issue, browse to the open list and its detail, back and forward, edit its title, then back through both lists. Exercises one create or edit updating every stored list and the detail through Queryable lookup (data-client) vs refetching after each mutation and fetching uncached views (TanStack Query, SWR) vs fetching every view (baseline). */
  createEditBrowse?(rounds: number, seedCount: number): Promise<void>;
  /** Move open issues to the closed list, switching to that list after each. Exercises Collection.move into the stored closed list (data-client) vs invalidate + refetch on mount (others). */
  moveThenSwitch?(navigations: number, seedCount: number): Promise<void>;
  /** Untimed: create an issue the library's usual way, resolving with its number once the library has handled the reply. */
  createItem?(): Promise<number>;
  /** Untimed: change an issue's state the library's usual way, resolving once the library has handled the reply. */
  moveToState?(number: number, state: 'open' | 'closed'): Promise<void>;
  /** Untimed: change an issue's title the library's usual way, resolving once the library has handled the reply. */
  editTitle?(number: number, title: string): Promise<void>;
  /** Mount list + detail panel + pinned card strip for multi-view entity propagation. */
  initMultiView?(count: number): void;
  /** Update an entity that appears in list + detail + pinned views; waits for all three to reflect the change. */
  updateEntityMultiView?(id: number): void;
  /** Mount the issue list (count issues) and a ticker strip, with all tickers in the store. data-client only. */
  initTickerStream?(count: number): Promise<void>;
  /**
   * Send `messages` ticker batches, one per task (like websocket messages), each after the previous one settles.
   * Records one `stream-message` measure per message; the runner aggregates them.
   * Resolves with the last update of each rendered ticker. data-client only.
   */
  streamTickers?(messages: number): Promise<{ finalRendered: Ticker[] }>;
  /** Trigger store garbage collection (data-client only). Used by memory scenarios to flush unreferenced data before heap measurement. */
  triggerGC?(): void;
  /** Cap DOM rendering to the first N items while keeping all data in the store. */
  setRenderLimit?(n: number | undefined): void;
  /** Resolves when the harness next signals completion. Call it before starting the action. */
  whenComplete(): Promise<void>;
  /** For validation: apply each kind of server mutation and check that list replies match a fresh serialization. Returns the first mismatch, or null. */
  checkIssueListJSON(): Promise<string | null>;
  /** Clear client-side cache/store so the next mount triggers a fresh fetch. Called between sub-iterations for mount scenarios. */
  resetStore?(): void;
}

declare global {
  interface Window {
    __BENCH__?: BenchAPI;
  }
}

export interface Label {
  id: number;
  nodeId: string;
  name: string;
  description: string;
  color: string;
  default: boolean;
}

export interface User {
  id: number;
  login: string;
  nodeId: string;
  avatarUrl: string;
  gravatarId: string;
  type: string;
  siteAdmin: boolean;
  htmlUrl: string;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  bio: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  locked: boolean;
  comments: number;
  labels: Label[];
  user: User;
  htmlUrl: string;
  repositoryUrl: string;
  authorAssociation: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Ticker {
  symbol: string;
  price: number;
  /** Percent change from the open. */
  change: number;
  volume: number;
  /** Epoch ms of the last trade. */
  time: number;
}

export type ScenarioAction =
  | { action: 'init'; args: [number] }
  | { action: 'updateEntity'; args: [number] }
  | { action: 'updateEntityMultiView'; args: [number] }
  | { action: 'updateUser'; args: [string] }
  | { action: 'unmountAll'; args: [] }
  | { action: 'unshiftItem'; args: [] }
  | { action: 'deleteEntity'; args: [number] }
  | { action: 'moveItem'; args: [number] };

export type ResultMetric =
  | 'duration'
  | 'issueRefChanged'
  | 'userRefChanged'
  | 'issueRowRenders'
  | 'heapDelta';

/** hotPath = JS only, included in CI. memory = heap delta, not CI. startup = page load metrics, not CI. */
export type ScenarioCategory = 'hotPath' | 'memory' | 'startup';

/** small = cheap scenarios (full warmup + measurement). large = expensive scenarios (reduced runs). */
export type ScenarioSize = 'small' | 'large';

export interface Scenario {
  name: string;
  action: keyof BenchAPI;
  args: unknown[];
  /** Which value to report; default 'duration'. Count scenarios use issueRefChanged/userRefChanged/issueRowRenders; memory use heapDelta. */
  resultMetric?: ResultMetric;
  /** hotPath (default) = run in CI. memory = heap delta. startup = page load metrics. */
  category?: ScenarioCategory;
  /** small (default) = full runs. large = reduced warmup/measurement for expensive scenarios. */
  size?: ScenarioSize;
  /** For update scenarios: number of issues to mount before running the update (default 100). */
  mountCount?: number;
  /** Use a different BenchAPI method to pre-mount (e.g. 'mountSortedView' instead of 'mount'). */
  preMountAction?: keyof BenchAPI;
  /** Result is deterministic (zero variance); run exactly once with no warmup. */
  deterministic?: boolean;
  /** Cap DOM rendering to first N items while keeping all data in the store. */
  renderLimit?: number;
  /** If set, scenario applies only to these libs; dropped when any selected library is not listed. */
  onlyLibs?: string[];
  /** Duration of each iteration from all its `measure` entries, instead of the last `update-duration` / `mount-duration`. */
  durationMeasure?: AggregatedMeasure;
  /**
   * Also report these from each iteration, as `<name>-<suffix>` entries in ops/s.
   * Maps suffix to an aggregated measure, e.g. { 'worst-message': { measure: 'stream-message', aggregate: 'max' } }.
   */
  extraMeasures?: Record<
    string,
    AggregatedMeasure & {
      /** false = not reported in CI. */
      ci?: boolean;
    }
  >;
}

/** How to combine every `performance.measure` entry of one name in an iteration. */
export type MeasureAggregate = 'sum' | 'max' | 'p95';

export interface AggregatedMeasure {
  measure: string;
  aggregate: MeasureAggregate;
}

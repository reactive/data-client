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

/** Axes for browser GC scenarios (local mirror of the shared GC vocabulary). */
export interface GCScenarioConfig {
  candidateKind: 'entity' | 'endpoint' | 'mixed';
  /** `duplicate` is entity-only (one path released `count` times). */
  pattern: 'unique' | 'duplicate';
  /** Canonical counts: 1000 | 10000 | 100000 */
  count: number;
  control: 'gc' | 'no-gc';
}

/** Queue cardinality after prepare (fixtures + createCountRef outside timing). */
export interface GCPreparedSummary {
  queueEntries: number;
  uniqueTargets: number;
}

/**
 * Page-side GC interaction measurement (schemaVersion 1).
 * Heap fields are attached by the Playwright runner, not page code.
 */
export interface GCBrowserMeasurement {
  schemaVersion: 1;
  totalMs: number;
  /** Monolithic baseline: exactly `[totalMs]` when control is `gc`; empty for `no-gc`. */
  sliceDurationsMs: number[];
  actionCount: number;
  queueEntries: number;
  uniqueTargets: number;
  actionTargetCount: number;
  deletionCount: number;
  /** Actual setTimeout(0) callback delay from immediately before collection. */
  timerDelayMs: number;
  /** Raw rAF intervals around collection. */
  frameIntervalsMs: number[];
  /** Quiet-frame period measured during prepare (never hardcode 16.67). */
  displayPeriodMs: number;
  /**
   * Excess whole frame periods vs displayPeriodMs (nearest-period; see harness).
   */
  missedFrames: number;
  /**
   * Responsiveness proxy: max(timerDelayMs, max excess of any frame interval
   * over one displayPeriodMs). Not pointer/input-event latency — no synthetic
   * pointer events are generated.
   */
  maxInputDelayMs: number;
  longTaskCount: number;
  longTaskTotalMs: number;
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
  /** Mount list + detail panel + pinned card strip for multi-view entity propagation. */
  initMultiView?(count: number): void;
  /** Update an entity that appears in list + detail + pinned views; waits for all three to reflect the change. */
  updateEntityMultiView?(id: number): void;
  /** Trigger store garbage collection (data-client only). Used by memory scenarios to flush unreferenced data before heap measurement. */
  triggerGC?(): void;
  /** Cap DOM rendering to the first N items while keeping all data in the store. */
  setRenderLimit?(n: number | undefined): void;
  /** Clear client-side cache/store so the next mount triggers a fresh fetch. Called between sub-iterations for mount scenarios. */
  resetStore?(): void;
  /**
   * Prepare isolated browser GC fixtures + queues (untimed). data-client only.
   * Also measures quiet displayPeriodMs. Does not start interaction timing.
   * Dynamically loads the GC harness chunk during prepare (before timing).
   */
  prepareGCScenario?(config: GCScenarioConfig): Promise<GCPreparedSummary>;
  /**
   * Run explicit monolithic cache GC (or no-gc control) with interaction probes.
   * Resolves only after timer + rAF probes settle. data-client only.
   */
  runGCScenario?(): Promise<GCBrowserMeasurement>;
  /** Tear down the isolated GC harness (store + policy). data-client only. */
  disposeGCScenario?(): void;
  /**
   * Validation/calibration only: synthetic ~40–50ms block through the Chromium
   * frame probe. Confirms blocking spans pending frame boundaries.
   */
  calibrateGCFrameProbe?(blockMs?: number): Promise<{
    blockMs: number;
    totalMs: number;
    timerDelayMs: number;
    displayPeriodMs: number;
    frameIntervalsMs: number[];
    frameIntervalMax: number;
    missedFrames: number;
    maxInputDelayMs: number;
    spannedPendingFrame: boolean;
  }>;
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
  'duration' | 'issueRefChanged' | 'userRefChanged' | 'heapDelta' | 'totalMs';

/** hotPath = JS only, included in CI. memory = heap delta, not CI. startup = page load metrics, not CI. gc = cache GC interaction, not CI. */
export type ScenarioCategory = 'hotPath' | 'memory' | 'startup' | 'gc';

/** small = cheap scenarios (full warmup + measurement). large = expensive scenarios (reduced runs). */
export type ScenarioSize = 'small' | 'large';

export interface Scenario {
  name: string;
  action: keyof BenchAPI;
  args: unknown[];
  /** Which value to report; default 'duration'. Ref-stability use issueRefChanged/userRefChanged; memory use heapDelta; gc use totalMs. */
  resultMetric?: ResultMetric;
  /** hotPath (default) = run in CI. memory = heap delta. startup = page load metrics. gc = cache GC (opt-in). */
  category?: ScenarioCategory;
  /** small (default) = full runs. large = reduced warmup/measurement for expensive scenarios. */
  size?: ScenarioSize;
  /** For update scenarios: number of issues to mount before running the update (default 100). */
  mountCount?: number;
  /** Use a different BenchAPI method to pre-mount (e.g. 'mountSortedView' instead of 'mount'). */
  preMountAction?: keyof BenchAPI;
  /** Result is deterministic (zero variance); run exactly once with no warmup. */
  deterministic?: boolean;
  /** Override the default sub-iterations per page visit for this scenario. */
  opsPerRound?: number;
  /** Cap DOM rendering to first N items while keeping all data in the store. */
  renderLimit?: number;
  /** If set, scenario applies only to these libs; dropped when any selected library is not listed. */
  onlyLibs?: string[];
}

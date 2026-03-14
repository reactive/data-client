import type { BenchAPI, Scenario, ScenarioSize } from '../src/shared/types.js';

export interface RunProfile {
  warmup: number;
  minMeasurement: number;
  maxMeasurement: number;
  /** Stop early when 95% CI margin is within this % of the median. */
  targetMarginPct: number;
}

export const RUN_CONFIG: Record<ScenarioSize, RunProfile> = {
  small: {
    warmup: 3,
    minMeasurement: 3,
    maxMeasurement: process.env.CI ? 10 : 20,
    targetMarginPct: process.env.CI ? 15 : 10,
  },
  large: {
    warmup: 1,
    minMeasurement: 2,
    maxMeasurement: process.env.CI ? 4 : 8,
    targetMarginPct: process.env.CI ? 20 : 15,
  },
};

export const ACTION_GROUPS: Record<string, (keyof BenchAPI)[]> = {
  mount: ['init', 'mountSortedView'],
  update: ['updateEntity', 'updateAuthor'],
  mutation: ['createEntity', 'deleteEntity', 'invalidateAndResolve'],
  memory: ['mountUnmountCycle'],
};

interface BaseScenario {
  nameSuffix: string;
  action: Scenario['action'];
  args: unknown[];
  resultMetric?: Scenario['resultMetric'];
  category: NonNullable<Scenario['category']>;
  size?: ScenarioSize;
  mountCount?: number;
  /** Use a different BenchAPI method to pre-mount items (e.g. 'mountSortedView' instead of 'mount'). */
  preMountAction?: keyof BenchAPI;
  /** Only run for these libraries. Omit to run for all. */
  onlyLibs?: string[];
  /** Simulated per-request network latency in ms (applied at the server layer). */
  networkDelayMs?: number;
  /** Result is deterministic (zero variance); run exactly once with no warmup. */
  deterministic?: boolean;
}

const BASE_SCENARIOS: BaseScenario[] = [
  {
    nameSuffix: 'init-100',
    action: 'init',
    args: [100],
    category: 'hotPath',
  },
  {
    nameSuffix: 'init-500',
    action: 'init',
    args: [500],
    category: 'hotPath',
    size: 'large',
  },
  {
    nameSuffix: 'update-single-entity',
    action: 'updateEntity',
    args: ['item-0'],
    category: 'hotPath',
  },
  {
    nameSuffix: 'update-shared-author-duration',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'hotPath',
  },
  {
    nameSuffix: 'ref-stability-item-changed',
    action: 'updateEntity',
    args: ['item-0'],
    resultMetric: 'itemRefChanged',
    category: 'hotPath',
    deterministic: true,
  },
  {
    nameSuffix: 'ref-stability-author-changed',
    action: 'updateAuthor',
    args: ['author-0'],
    resultMetric: 'authorRefChanged',
    category: 'hotPath',
    deterministic: true,
  },
  {
    nameSuffix: 'update-shared-author-with-network',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'withNetwork',
    size: 'large',
    networkDelayMs: 50,
  },
  {
    nameSuffix: 'update-shared-author-500-mounted',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'hotPath',
    mountCount: 500,
    size: 'large',
  },
  {
    nameSuffix: 'memory-mount-unmount-cycle',
    action: 'mountUnmountCycle',
    args: [500, 10],
    resultMetric: 'heapDelta',
    category: 'memory',
    size: 'large',
  },
  {
    nameSuffix: 'sorted-view-mount-500',
    action: 'mountSortedView',
    args: [500],
    category: 'hotPath',
    size: 'large',
  },
  {
    nameSuffix: 'sorted-view-update-entity',
    action: 'updateEntity',
    args: ['item-0'],
    category: 'hotPath',
    mountCount: 500,
    preMountAction: 'mountSortedView',
    size: 'large',
  },
  {
    nameSuffix: 'update-shared-author-2000-mounted',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'hotPath',
    mountCount: 2000,
    size: 'large',
  },
  {
    nameSuffix: 'invalidate-and-resolve',
    action: 'invalidateAndResolve',
    args: ['item-0'],
    category: 'hotPath',
    onlyLibs: ['data-client'],
  },
  {
    nameSuffix: 'create-item',
    action: 'createEntity',
    args: [],
    category: 'hotPath',
    mountCount: 100,
  },
  {
    nameSuffix: 'delete-item',
    action: 'deleteEntity',
    args: ['item-0'],
    category: 'hotPath',
    mountCount: 100,
  },
];

export const LIBRARIES = [
  'data-client',
  'tanstack-query',
  'swr',
  'baseline',
] as const;

export const SCENARIOS: Scenario[] = LIBRARIES.flatMap(lib =>
  BASE_SCENARIOS.filter(
    base => !base.onlyLibs || base.onlyLibs.includes(lib),
  ).map(
    (base): Scenario => ({
      name: `${lib}: ${base.nameSuffix}`,
      action: base.action,
      args: base.args,
      resultMetric: base.resultMetric,
      category: base.category,
      size: base.size,
      mountCount: base.mountCount,
      preMountAction: base.preMountAction,
      networkDelayMs: base.networkDelayMs,
      deterministic: base.deterministic,
    }),
  ),
);

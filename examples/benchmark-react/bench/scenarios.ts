import type { BenchAPI, Scenario, ScenarioSize } from '../src/shared/types.js';

export const SIMULATED_NETWORK_DELAY_MS = 50;

export const RUN_CONFIG: Record<
  ScenarioSize,
  { warmup: number; measurement: number }
> = {
  small: { warmup: 3, measurement: process.env.CI ? 10 : 15 },
  large: { warmup: 1, measurement: process.env.CI ? 3 : 4 },
};

export const ACTION_GROUPS: Record<string, (keyof BenchAPI)[]> = {
  mount: ['init', 'mountSortedView'],
  update: ['updateEntity', 'updateAuthor'],
  mutation: [
    'createEntity',
    'deleteEntity',
    'optimisticUpdate',
    'invalidateAndResolve',
  ],
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
  /** Override args per library (e.g. different request counts for withNetwork). */
  perLibArgs?: Partial<Record<string, unknown[]>>;
  /** Only run for these libraries. Omit to run for all. */
  onlyLibs?: string[];
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
  },
  {
    nameSuffix: 'ref-stability-author-changed',
    action: 'updateAuthor',
    args: ['author-0'],
    resultMetric: 'authorRefChanged',
    category: 'hotPath',
  },
  {
    nameSuffix: 'update-shared-author-with-network',
    action: 'updateAuthor',
    args: [
      'author-0',
      {
        simulateNetworkDelayMs: SIMULATED_NETWORK_DELAY_MS,
        simulatedRequestCount: 1,
      },
    ],
    category: 'withNetwork',
    size: 'large',
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
    nameSuffix: 'optimistic-update',
    action: 'optimisticUpdate',
    args: [],
    category: 'hotPath',
    onlyLibs: ['data-client'],
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
      args: base.perLibArgs?.[lib] ?? base.args,
      resultMetric: base.resultMetric,
      category: base.category,
      size: base.size,
      mountCount: base.mountCount,
      preMountAction: base.preMountAction,
    }),
  ),
);

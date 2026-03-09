import type { Scenario } from '../src/shared/types.js';

export const SIMULATED_NETWORK_DELAY_MS = 50;

/**
 * With 100 mounted items and 20 authors, each author is shared by 5 items.
 * Non-normalized libs must refetch each affected item query individually.
 */
const ITEMS_PER_AUTHOR_100 = 5;

interface BaseScenario {
  nameSuffix: string;
  action: Scenario['action'];
  args: unknown[];
  resultMetric?: Scenario['resultMetric'];
  category: NonNullable<Scenario['category']>;
  mountCount?: number;
  /** Use a different BenchAPI method to pre-mount items (e.g. 'mountSortedView' instead of 'mount'). */
  preMountAction?: keyof import('../src/shared/types.js').BenchAPI;
  /** Override args per library (e.g. different request counts for withNetwork). */
  perLibArgs?: Partial<Record<string, unknown[]>>;
  /** Only run for these libraries. Omit to run for all. */
  onlyLibs?: string[];
}

const BASE_SCENARIOS: BaseScenario[] = [
  {
    nameSuffix: 'mount-100-items',
    action: 'mount',
    args: [100],
    category: 'hotPath',
  },
  {
    nameSuffix: 'mount-500-items',
    action: 'mount',
    args: [500],
    category: 'hotPath',
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
    perLibArgs: {
      'tanstack-query': [
        'author-0',
        {
          simulateNetworkDelayMs: SIMULATED_NETWORK_DELAY_MS,
          simulatedRequestCount: ITEMS_PER_AUTHOR_100,
        },
      ],
      swr: [
        'author-0',
        {
          simulateNetworkDelayMs: SIMULATED_NETWORK_DELAY_MS,
          simulatedRequestCount: ITEMS_PER_AUTHOR_100,
        },
      ],
      baseline: [
        'author-0',
        {
          simulateNetworkDelayMs: SIMULATED_NETWORK_DELAY_MS,
          simulatedRequestCount: ITEMS_PER_AUTHOR_100,
        },
      ],
    },
    category: 'withNetwork',
  },
  {
    nameSuffix: 'update-shared-author-500-mounted',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'hotPath',
    mountCount: 500,
  },
  {
    nameSuffix: 'memory-mount-unmount-cycle',
    action: 'mountUnmountCycle',
    args: [500, 10],
    resultMetric: 'heapDelta',
    category: 'memory',
  },
  {
    nameSuffix: 'optimistic-update',
    action: 'optimisticUpdate',
    args: [],
    category: 'hotPath',
    onlyLibs: ['data-client'],
  },
  {
    nameSuffix: 'bulk-ingest-500',
    action: 'bulkIngest',
    args: [500],
    category: 'hotPath',
  },
  {
    nameSuffix: 'sorted-view-mount-500',
    action: 'mountSortedView',
    args: [500],
    category: 'hotPath',
  },
  {
    nameSuffix: 'sorted-view-update-entity',
    action: 'updateEntity',
    args: ['item-0'],
    category: 'hotPath',
    mountCount: 500,
    preMountAction: 'mountSortedView',
  },
  {
    nameSuffix: 'update-shared-author-1000-mounted',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'hotPath',
    mountCount: 1000,
  },
  {
    nameSuffix: 'invalidate-and-resolve',
    action: 'invalidateAndResolve',
    args: ['item-0'],
    category: 'hotPath',
    onlyLibs: ['data-client'],
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
      mountCount: base.mountCount,
      preMountAction: base.preMountAction,
    }),
  ),
);

export const WARMUP_RUNS = 2;
export const MEASUREMENT_RUNS = process.env.CI ? 5 : 20;

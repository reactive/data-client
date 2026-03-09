import type { Scenario } from '../src/shared/types.js';

/** Simulated network delay (ms) per request for with-network scenarios. Consistent for comparability. */
export const SIMULATED_NETWORK_DELAY_MS = 50;

interface BaseScenario {
  nameSuffix: string;
  action: Scenario['action'];
  args: unknown[];
  resultMetric?: Scenario['resultMetric'];
  category: NonNullable<Scenario['category']>;
  mountCount?: number;
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
    nameSuffix: 'optimistic-update-rollback',
    action: 'optimisticRollback',
    args: [],
    category: 'hotPath',
  },
];

export const LIBRARIES = [
  'data-client',
  'tanstack-query',
  'swr',
  'baseline',
] as const;

export const SCENARIOS: Scenario[] = LIBRARIES.flatMap(lib =>
  BASE_SCENARIOS.map(
    (base): Scenario => ({
      name: `${lib}: ${base.nameSuffix}`,
      action: base.action,
      args: base.args,
      resultMetric: base.resultMetric,
      category: base.category,
      mountCount: base.mountCount,
    }),
  ),
);

export const WARMUP_RUNS = 2;
export const MEASUREMENT_RUNS = process.env.CI ? 5 : 20;

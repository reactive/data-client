import type { Scenario } from '../src/shared/types.js';

/** Simulated network delay (ms) per request for with-network scenarios. Consistent for comparability. */
export const SIMULATED_NETWORK_DELAY_MS = 50;

export const SCENARIOS: Scenario[] = [
  {
    name: 'data-client: mount-100-items',
    action: 'mount',
    args: [100],
    category: 'hotPath',
  },
  {
    name: 'data-client: mount-500-items',
    action: 'mount',
    args: [500],
    category: 'hotPath',
  },
  {
    name: 'data-client: update-single-entity',
    action: 'updateEntity',
    args: ['item-0'],
    category: 'hotPath',
  },
  {
    name: 'data-client: update-shared-author-duration',
    action: 'updateAuthor',
    args: ['author-0'],
    category: 'hotPath',
  },
  {
    name: 'data-client: ref-stability-item-changed',
    action: 'updateEntity',
    args: ['item-0'],
    resultMetric: 'itemRefChanged',
    category: 'hotPath',
  },
  {
    name: 'data-client: ref-stability-author-changed',
    action: 'updateAuthor',
    args: ['author-0'],
    resultMetric: 'authorRefChanged',
    category: 'hotPath',
  },
  {
    name: 'data-client: update-shared-author-with-network',
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
];

export const WARMUP_RUNS = 2;
export const MEASUREMENT_RUNS = process.env.CI ? 5 : 20;
export const LIBRARIES = ['data-client'] as const;

import type { BenchAPI, Scenario, ScenarioSize } from '../src/shared/types.js';

/** Response-size-based network simulation used when --network-sim is enabled (default: on).
 *  Delay per request = baseLatencyMs + ceil(recordCount / recordsPerMs). */
export const NETWORK_SIM_CONFIG = {
  baseLatencyMs: 40,
  recordsPerMs: 20,
};

export interface RunProfile {
  warmup: number;
  minMeasurement: number;
  maxMeasurement: number;
  /** Stop early when 95% CI margin is within this % of the median. */
  targetMarginPct: number;
  /** Sub-iterations per page visit; median of N is returned as one sample. */
  opsPerRound: number;
}

const defaultOpsPerRound = parseInt(process.env.BENCH_OPS_PER_ROUND ?? '5', 10);

export const RUN_CONFIG: Record<ScenarioSize, RunProfile> = {
  small: {
    warmup: 2,
    minMeasurement: 3,
    maxMeasurement: process.env.CI ? 15 : 12,
    targetMarginPct: process.env.CI ? 5 : 10,
    opsPerRound: defaultOpsPerRound,
  },
  large: {
    warmup: 1,
    minMeasurement: 3,
    maxMeasurement: process.env.CI ? 12 : 6,
    targetMarginPct: process.env.CI ? 8 : 15,
    opsPerRound: defaultOpsPerRound,
  },
};

export const ACTION_GROUPS: Record<string, (keyof BenchAPI)[]> = {
  mount: ['init', 'initDoubleList', 'mountSortedView', 'listDetailSwitch'],
  update: ['updateEntity', 'updateUser'],
  mutation: ['unshiftItem', 'deleteEntity', 'invalidateAndResolve', 'moveItem'],
  memory: ['mountUnmountCycle'],
};

type BaseScenario = Omit<Scenario, 'name' | 'category'> & {
  nameSuffix: string;
  category: NonNullable<Scenario['category']>;
};

const BASE_SCENARIOS: BaseScenario[] = [
  {
    nameSuffix: 'getlist-100',
    action: 'init',
    args: [100],
    category: 'hotPath',
  },
  {
    nameSuffix: 'getlist-500',
    action: 'init',
    args: [500],
    category: 'hotPath',
    size: 'large',
  },
  {
    nameSuffix: 'update-entity',
    action: 'updateEntity',
    args: [1],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
  },
  {
    nameSuffix: 'ref-stability-issue-changed',
    action: 'updateEntity',
    args: [1],
    resultMetric: 'issueRefChanged',
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
    deterministic: true,
  },
  {
    nameSuffix: 'ref-stability-user-changed',
    action: 'updateUser',
    args: ['user0'],
    resultMetric: 'userRefChanged',
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
    deterministic: true,
  },
  {
    nameSuffix: 'update-user',
    action: 'updateUser',
    args: ['user0'],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
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
    nameSuffix: 'getlist-500-sorted',
    action: 'mountSortedView',
    args: [500],
    category: 'hotPath',
    size: 'large',
  },
  {
    nameSuffix: 'update-entity-sorted',
    action: 'updateEntity',
    args: [1],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
    preMountAction: 'mountSortedView',
    size: 'large',
    opsPerRound: 9,
  },
  {
    nameSuffix: 'update-entity-multi-view',
    action: 'updateEntityMultiView',
    args: [1],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
    preMountAction: 'initMultiView',
    size: 'large',
  },
  {
    nameSuffix: 'list-detail-switch-10',
    action: 'listDetailSwitch',
    args: [10, 1000],
    category: 'hotPath',
    size: 'large',
    renderLimit: 100,
    opsPerRound: 5,
  },
  {
    nameSuffix: 'update-user-10000',
    action: 'updateUser',
    args: ['user0'],
    category: 'hotPath',
    mountCount: 10000,
    size: 'large',
    renderLimit: 100,
  },
  {
    nameSuffix: 'invalidate-and-resolve',
    action: 'invalidateAndResolve',
    args: [1],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
    onlyLibs: ['data-client'],
  },
  {
    nameSuffix: 'unshift-item',
    action: 'unshiftItem',
    args: [],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
  },
  {
    nameSuffix: 'delete-item',
    action: 'deleteEntity',
    args: [1],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
  },
  {
    nameSuffix: 'move-item',
    action: 'moveItem',
    args: [1],
    category: 'hotPath',
    mountCount: 1000,
    renderLimit: 100,
    preMountAction: 'initDoubleList',
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
    ({ nameSuffix, onlyLibs, ...rest }): Scenario => ({
      name: `${lib}: ${nameSuffix}`,
      ...rest,
      ...(onlyLibs ? { onlyLibs: [...onlyLibs] } : {}),
    }),
  ),
);

import type { BenchAPI, Scenario, ScenarioSize } from '../src/shared/types.js';

/** Per-method network latency used when --network-sim is enabled (default: on). */
export const NETWORK_SIM_DELAYS: Record<string, number> = {
  fetchIssueList: 80,
  fetchIssue: 50,
  fetchUser: 50,
  createIssue: 50,
  updateIssue: 50,
  updateUser: 50,
  deleteIssue: 50,
  deleteUser: 50,
};

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
  },
  {
    nameSuffix: 'list-detail-switch',
    action: 'listDetailSwitch',
    args: [1000],
    category: 'hotPath',
    size: 'large',
    renderLimit: 100,
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

export const LIBRARIES = ['data-client', 'tanstack-query', 'swr'] as const;

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

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
  /** Result is deterministic (zero variance); run exactly once with no warmup. */
  deterministic?: boolean;
}

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
    nameSuffix: 'update-single-entity',
    action: 'updateEntity',
    args: [1],
    category: 'hotPath',
  },
  {
    nameSuffix: 'ref-stability-issue-changed',
    action: 'updateEntity',
    args: [1],
    resultMetric: 'issueRefChanged',
    category: 'hotPath',
    deterministic: true,
  },
  {
    nameSuffix: 'ref-stability-user-changed',
    action: 'updateUser',
    args: ['user0'],
    resultMetric: 'userRefChanged',
    category: 'hotPath',
    deterministic: true,
  },
  {
    nameSuffix: 'update-shared-user-500-mounted',
    action: 'updateUser',
    args: ['user0'],
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
    args: [1],
    category: 'hotPath',
    mountCount: 500,
    preMountAction: 'mountSortedView',
    size: 'large',
  },
  {
    nameSuffix: 'list-detail-switch',
    action: 'listDetailSwitch',
    args: [500],
    category: 'hotPath',
    size: 'large',
  },
  {
    nameSuffix: 'update-shared-user-10000-mounted',
    action: 'updateUser',
    args: ['user0'],
    category: 'hotPath',
    mountCount: 10000,
    size: 'large',
  },
  {
    nameSuffix: 'invalidate-and-resolve',
    action: 'invalidateAndResolve',
    args: [1],
    category: 'hotPath',
    onlyLibs: ['data-client'],
  },
  {
    nameSuffix: 'unshift-item',
    action: 'unshiftItem',
    args: [],
    category: 'hotPath',
    mountCount: 100,
  },
  {
    nameSuffix: 'delete-item',
    action: 'deleteEntity',
    args: [1],
    category: 'hotPath',
    mountCount: 100,
  },
  {
    nameSuffix: 'move-item',
    action: 'moveItem',
    args: [1],
    category: 'hotPath',
    mountCount: 100,
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
    (base): Scenario => ({
      name: `${lib}: ${base.nameSuffix}`,
      action: base.action,
      args: base.args,
      resultMetric: base.resultMetric,
      category: base.category,
      size: base.size,
      mountCount: base.mountCount,
      preMountAction: base.preMountAction,
      deterministic: base.deterministic,
    }),
  ),
);

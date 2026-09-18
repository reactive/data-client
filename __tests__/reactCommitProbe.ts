/**
 * DevTools commit-priority probe. `__REACT_DEVTOOLS_GLOBAL_HOOK__` is installed
 * in ReactDOM `scripts/testSetup.js` so `isDevToolsPresent` is true even when
 * a suite `jest.mock('react-dom')` `requireActual`s client before this import.
 * This module only attaches the commit recorder onto that hook object.
 *
 * `priority` is committed lanes → event priority → scheduler priority:
 * 1 Immediate, 2 UserBlocking, 3 Normal (DefaultLane and TransitionLanes),
 * 5 Idle. This is a React development-build implementation surface; suites
 * that use it must self-calibrate (fail-loud).
 */
import { version } from 'react';

const {
  unstable_ImmediatePriority: ImmediatePriority,
  unstable_NormalPriority: NormalPriority,
  unstable_IdlePriority: IdlePriority,
} = require('scheduler') as {
  unstable_ImmediatePriority: number;
  unstable_NormalPriority: number;
  unstable_IdlePriority: number;
};

export { ImmediatePriority, NormalPriority, IdlePriority };

export interface CommitRecord {
  priority: number | undefined;
  updaters: string[];
}

export const commits: CommitRecord[] = [];

export const resetCommits = () => {
  commits.length = 0;
};

function fiberName(fiber: { type?: unknown }): string {
  const type = fiber?.type as
    | string
    | { displayName?: string; name?: string; render?: { name?: string } }
    | undefined;
  if (typeof type === 'string') return type;
  if (typeof type === 'function') {
    return (
      (type as { displayName?: string; name?: string }).displayName ||
      (type as { name?: string }).name ||
      ''
    );
  }
  if (type && typeof type === 'object') {
    return type.displayName || type.render?.name || '';
  }
  return '';
}

export function expectNoImmediateCommit(label: string) {
  expect(commits.length).toBeGreaterThan(0);
  const bad = commits.filter(c => c.priority === ImmediatePriority);
  if (bad.length) {
    throw new Error(
      `${label}: Immediate commit on React ${version}: ${JSON.stringify(commits)}`,
    );
  }
}

export function expectOnlyNormalCommits(label: string) {
  expectNoImmediateCommit(label);
  const bad = commits.filter(c => c.priority !== NormalPriority);
  if (bad.length) {
    throw new Error(
      `${label}: non-Normal commit on React ${version}: ${JSON.stringify(commits)}`,
    );
  }
}

export function failCalibration(label: string): never {
  throw new Error(`${label} on React ${version}: ${JSON.stringify(commits)}`);
}

export function expectAllCommitsPriority(label: string, priority: number) {
  if (commits.length === 0 || commits.some(c => c.priority !== priority)) {
    failCalibration(label);
  }
}

export function makeNotifyStore() {
  const listeners = new Set<() => void>();
  let snapshot = 0;
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    notify() {
      snapshot += 1;
      listeners.forEach(fn => fn());
    },
  };
}

const hook = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
if (!hook) {
  throw new Error(
    '__REACT_DEVTOOLS_GLOBAL_HOOK__ must be installed in scripts/testSetup.js before react-dom loads',
  );
}
hook.onCommitFiberRoot = function onCommitFiberRoot(
  _id: number,
  root: any,
  priority?: number,
) {
  commits.push({
    priority,
    updaters: [...(root.memoizedUpdaters ?? [])].map(fiberName),
  });
};

/**
 * DevTools commit-priority probe. Import this module before `react-dom/client`
 * so `isDevToolsPresent` is captured with the hook installed.
 *
 * `priority` is committed lanes → event priority → scheduler priority:
 * 1 Immediate, 2 UserBlocking, 3 Normal (DefaultLane and TransitionLanes),
 * 5 Idle. This is a React development-build implementation surface; suites
 * that use it must self-calibrate.
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

(globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  supportsFiber: true,
  isDisabled: false,
  renderers: new Map(),
  inject: () => 1,
  onCommitFiberRoot(_id: number, root: any, priority?: number) {
    commits.push({
      priority,
      updaters: [...(root.memoizedUpdaters ?? [])].map(fiberName),
    });
  },
  onCommitFiberUnmount() {},
  onPostCommitFiberRoot() {},
  onScheduleFiberRoot() {},
  checkDCE() {},
};

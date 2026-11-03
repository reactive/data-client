import type { Issue, RefStabilityReport, User } from './types';

let currentIssues: Issue[] = [];
let snapshotRefs: Map<number, { issue: Issue; user: User }> | null = null;

/**
 * Store the current issues array. Called from ListView during render.
 * Only stores the reference — negligible cost.
 */
export function setCurrentIssues(issues: Issue[]): void {
  currentIssues = issues;
}

/**
 * Build a snapshot from current issues. Call after mount, before running an update.
 */
export function captureSnapshot(): void {
  snapshotRefs = new Map();
  for (const issue of currentIssues) {
    snapshotRefs.set(issue.number, { issue, user: issue.user });
  }
}

/**
 * Compare current issues to snapshot and return counts. Call after update completes.
 */
export function getReport(): RefStabilityReport {
  if (!snapshotRefs) {
    return {
      issueRefUnchanged: 0,
      issueRefChanged: 0,
      userRefUnchanged: 0,
      userRefChanged: 0,
    };
  }

  let issueRefUnchanged = 0;
  let issueRefChanged = 0;
  let userRefUnchanged = 0;
  let userRefChanged = 0;

  for (const issue of currentIssues) {
    const snap = snapshotRefs.get(issue.number);
    if (!snap) continue;

    if (issue === snap.issue) {
      issueRefUnchanged++;
    } else {
      issueRefChanged++;
    }
    if (issue.user === snap.user) {
      userRefUnchanged++;
    } else {
      userRefChanged++;
    }
  }

  return {
    issueRefUnchanged,
    issueRefChanged,
    userRefUnchanged,
    userRefChanged,
  };
}

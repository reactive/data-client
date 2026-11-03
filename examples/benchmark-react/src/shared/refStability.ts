import type { Issue, RefStabilityReport, User } from './types';

let currentIssues: Issue[] = [];
let snapshotRefs: Map<number, { issue: Issue; user: User }> | null = null;
let issueRowRenders = 0;
let listViewRenders = 0;

/**
 * Count one IssueRow render. Called from IssueRow's body; a call (not an
 * inline `++` on a module variable) so React Compiler still compiles IssueRow.
 */
export function noteIssueRowRender(): void {
  issueRowRenders++;
}

/** Count one ListView render. Called from ListView's body, like noteIssueRowRender. */
export function noteListViewRender(): void {
  listViewRenders++;
}

/**
 * Store the current issues array. Called from ListView during render.
 * Only stores the reference — negligible cost.
 */
export function setCurrentIssues(issues: Issue[]): void {
  currentIssues = issues;
}

/**
 * Build a snapshot from current issues and reset the render counts.
 * Call after mount, before running an update.
 */
export function captureSnapshot(): void {
  issueRowRenders = 0;
  listViewRenders = 0;
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
      issueRowRenders,
      listViewRenders,
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
    issueRowRenders,
    listViewRenders,
  };
}

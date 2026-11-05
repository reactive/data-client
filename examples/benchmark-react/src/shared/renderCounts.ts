import type { RenderCounts } from './types';

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

/** Start counting from zero. Call before the action whose renders you count. */
export function resetRenderCounts(): void {
  issueRowRenders = 0;
  listViewRenders = 0;
}

/** Renders since the last resetRenderCounts(). */
export function getRenderCounts(): RenderCounts {
  return { issueRowRenders, listViewRenders };
}

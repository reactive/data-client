import type { Controller } from '@data-client/react';

import { isPromise } from './isPromise';
import { type Issue, IssueResource } from './resources';

const recentTitles = new Map<number, string>();

function rememberTitle(id: number, issue: Issue) {
  recentTitles.set(id, issue.title);
}

// called when an issue row scrolls into view, so the tooltip can show its title
export function warmIssue(ctrl: Controller, id: number) {
  const result = ctrl.fetchIfStale(IssueResource.get, { id });
  if (!isPromise(result)) rememberTitle(id, result);
}

export const getRecentTitle = (id: number) => recentTitles.get(id);

import type { Controller } from '@data-client/react';

import { CommentResource, IssueResource, SettingsResource } from './resources';
import { setDocumentTitle } from './title';

export const DEFAULT_SETTINGS = { theme: 'light' as const, pageSize: 25 };

export async function issueLoader(ctrl: Controller, id: number) {
  // start comments without blocking the page
  Promise.resolve(
    ctrl.fetchIfStale(CommentResource.getList, { issueId: id }),
  ).catch(() => {});
  const issue = ctrl.fetchIfStale(IssueResource.get, { id });
  if (issue instanceof Promise) {
    const loaded = await issue;
    setDocumentTitle(loaded.title);
  } else {
    setDocumentTitle(issue.title);
  }
}

export async function settingsLoader(ctrl: Controller) {
  const settings = await ctrl.fetchIfStale(SettingsResource.get, { id: 'me' });
  // the settings service is flaky; fall back instead of failing the page
  return settings ?? DEFAULT_SETTINGS;
}

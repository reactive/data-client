/// <reference lib="webworker" />

import { FIXTURE_USERS, FIXTURE_ISSUES } from './data';
import type { Issue, Label, User } from './types';

declare const self: DedicatedWorkerGlobalScope;

// ── NETWORK DELAY ────────────────────────────────────────────────────────

let networkDelayMs = 0;
let methodDelays: Record<string, number> = {};

function respond(id: number, method: string, value: unknown) {
  const json = JSON.stringify(value);
  const delay = methodDelays[method] ?? networkDelayMs;
  if (delay <= 0) {
    self.postMessage({ id, result: json });
  } else {
    setTimeout(() => self.postMessage({ id, result: json }), delay);
  }
}

function respondError(id: number, message: string) {
  self.postMessage({ id, error: message });
}

// ── IN-MEMORY STORES ─────────────────────────────────────────────────────

const issueStore = new Map<number, Issue>();
const userStore = new Map<string, User>();
let masterList: Issue[] = [];
const stateIndex = new Map<string, Issue[]>();
const numberToPosition = new Map<number, number>();

function rebuildStateIndex() {
  stateIndex.clear();
  for (const issue of masterList) {
    let list = stateIndex.get(issue.state);
    if (!list) {
      list = [];
      stateIndex.set(issue.state, list);
    }
    list.push(issue);
  }
}

function rebuildPositionIndex() {
  numberToPosition.clear();
  for (let i = 0; i < masterList.length; i++) {
    numberToPosition.set(masterList[i].number, i);
  }
}

// Pre-seed with fixture data
for (const user of FIXTURE_USERS) {
  userStore.set(user.login, { ...user });
}
for (const issue of FIXTURE_ISSUES) {
  const seeded: Issue = {
    ...issue,
    user: { ...issue.user },
    labels: issue.labels.map(l => ({ ...l })),
  };
  issueStore.set(issue.number, seeded);
  masterList.push(seeded);
}
rebuildStateIndex();
rebuildPositionIndex();

// ── READ ─────────────────────────────────────────────────────────────────

function fetchIssue({ number }: { number: number }): Issue {
  const issue = issueStore.get(number);
  if (!issue) throw new Error(`No data for issue:${number}`);
  if (issue.user?.login) {
    const latest = userStore.get(issue.user.login);
    if (latest && latest !== issue.user) return { ...issue, user: latest };
  }
  return issue;
}

function fetchUser({ login }: { login: string }): User {
  const user = userStore.get(login);
  if (!user) throw new Error(`No data for user:${login}`);
  return user;
}

function fetchIssueList(params?: { count?: number; state?: string }): Issue[] {
  let issues: Issue[] =
    params?.state ? (stateIndex.get(params.state) ?? []) : masterList;
  if (params?.count) {
    issues = issues.slice(0, params.count);
  }
  issues = issues.map(issue => {
    if (issue.user?.login) {
      const latest = userStore.get(issue.user.login);
      if (latest && latest !== issue.user) return { ...issue, user: latest };
    }
    return issue;
  });
  return issues;
}

// ── CREATE ───────────────────────────────────────────────────────────────

let createIssueCounter = 0;

function createIssue(body: {
  title: string;
  user: User;
  labels?: Label[];
}): Issue {
  const num = 90000 + createIssueCounter++;
  const now = new Date().toISOString();
  const issue: Issue = {
    id: 300000 + num,
    number: num,
    title: body.title,
    body: '',
    state: 'open',
    locked: false,
    comments: 0,
    labels: body.labels ?? [],
    user: body.user,
    htmlUrl: `https://github.com/owner/repo/issues/${num}`,
    repositoryUrl: 'https://api.github.com/repos/owner/repo',
    authorAssociation: 'NONE',
    createdAt: now,
    updatedAt: now,
    closedAt: null,
  };
  issueStore.set(num, issue);
  masterList.unshift(issue);
  rebuildPositionIndex();
  const stateList = stateIndex.get(issue.state);
  if (stateList) {
    stateList.unshift(issue);
  } else {
    stateIndex.set(issue.state, [issue]);
  }
  return issue;
}

// ── UPDATE ───────────────────────────────────────────────────────────────

function updateIssue(params: {
  number: number;
  title?: string;
  state?: Issue['state'];
  user?: User;
}): Issue {
  const existing = issueStore.get(params.number);
  if (!existing) throw new Error(`No data for issue:${params.number}`);
  const updated: Issue = { ...existing, ...params };
  issueStore.set(params.number, updated);
  const idx = numberToPosition.get(params.number) ?? -1;
  if (idx >= 0) masterList[idx] = updated;
  if (existing.state !== updated.state) {
    rebuildStateIndex();
  } else {
    const sList = stateIndex.get(updated.state);
    if (sList) {
      const si = sList.indexOf(existing);
      if (si >= 0) sList[si] = updated;
    }
  }
  return updated;
}

function updateUser(params: { login: string; name?: string }): User {
  const existing = userStore.get(params.login);
  if (!existing) throw new Error(`No data for user:${params.login}`);
  const updated: User = { ...existing, ...params };
  userStore.set(params.login, updated);
  return updated;
}

// ── DELETE ────────────────────────────────────────────────────────────────

function deleteIssue({ number }: { number: number }): {
  id: number;
  number: number;
} {
  const existing = issueStore.get(number);
  issueStore.delete(number);
  const idx = numberToPosition.get(number) ?? -1;
  if (idx >= 0) {
    masterList.splice(idx, 1);
    rebuildPositionIndex();
  }
  rebuildStateIndex();
  return { id: existing?.id ?? 0, number };
}

function deleteUser({ login }: { login: string }): { login: string } {
  userStore.delete(login);
  return { login };
}

// ── DIRECT STORE ACCESS ──────────────────────────────────────────────────

function getIssue(number: number): Issue | undefined {
  return issueStore.get(number);
}

function patchIssue(number: number, patch: Partial<Issue>): void {
  const existing = issueStore.get(number);
  if (!existing) return;
  const updated: Issue = { ...existing, ...patch };
  issueStore.set(number, updated);
  const idx = numberToPosition.get(number) ?? -1;
  if (idx >= 0) masterList[idx] = updated;
  if (existing.state !== updated.state) {
    rebuildStateIndex();
  } else {
    const sList = stateIndex.get(updated.state);
    if (sList) {
      const si = sList.indexOf(existing);
      if (si >= 0) sList[si] = updated;
    }
  }
}

function seedIssueList(issues: Issue[]): void {
  masterList = issues;
  issueStore.clear();
  userStore.clear();
  for (const issue of issues) {
    issueStore.set(issue.number, issue);
    if (issue.user) userStore.set(issue.user.login, issue.user);
  }
  rebuildStateIndex();
  rebuildPositionIndex();
}

// ── MESSAGE HANDLER ──────────────────────────────────────────────────────

const methods: Record<string, (params: any) => unknown> = {
  fetchIssue,
  fetchUser,
  fetchIssueList,
  createIssue,
  updateIssue,
  updateUser,
  deleteIssue,
  deleteUser,
  getIssue: ({ number }: { number: number }) => getIssue(number),
  patchIssue: ({ number, patch }: { number: number; patch: Partial<Issue> }) =>
    patchIssue(number, patch),
  seedIssueList: ({ issues }: { issues: Issue[] }) => seedIssueList(issues),
  setNetworkDelay: ({ ms }: { ms: number }) => {
    networkDelayMs = ms;
    methodDelays = {};
  },
  setMethodDelays: ({ delays }: { delays: Record<string, number> }) => {
    methodDelays = delays;
  },
};

self.onmessage = (e: MessageEvent) => {
  const { id, method, params } = e.data as {
    id: number;
    method: string;
    params: any;
  };

  const fn = methods[method];
  if (!fn) {
    respondError(id, `Unknown method: ${method}`);
    return;
  }

  try {
    const result = fn(params);
    respond(id, method, result === undefined ? null : result);
  } catch (err) {
    respondError(id, err instanceof Error ? err.message : String(err));
  }
};

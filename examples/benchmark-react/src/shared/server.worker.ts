/// <reference lib="webworker" />

import { FIXTURE_USERS, FIXTURE_ISSUES, getFixtureTickers } from './data';
import type { Issue, Label, Ticker, User } from './types';

declare const self: DedicatedWorkerGlobalScope;

// ── NETWORK DELAY ────────────────────────────────────────────────────────

let networkDelayMs = 0;
let networkSim: { baseLatencyMs: number; recordsPerMs: number } | null = null;

/** A reply body that is already JSON. */
class JSONReply {
  constructor(
    readonly json: string,
    readonly recordCount: number,
  ) {}
}

/** While true, mutation replies wait in `heldReplies` until release. */
let holdMutations = false;
const heldReplies: (() => void)[] = [];

function respond(id: number, value: unknown, mutation: boolean) {
  const isReply = value instanceof JSONReply;
  const json = isReply ? value.json : JSON.stringify(value);
  const recordCount =
    isReply ? value.recordCount
    : Array.isArray(value) ? value.length
    : 1;
  const delay =
    networkSim ?
      networkSim.baseLatencyMs +
      Math.ceil(recordCount / networkSim.recordsPerMs)
    : networkDelayMs;
  const post = () => self.postMessage({ id, result: json });
  const send = () =>
    mutation && holdMutations ? heldReplies.push(post) : post();
  if (delay <= 0) send();
  else setTimeout(send, delay);
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
  return withLatestUser(issue);
}

function fetchUser({ login }: { login: string }): User {
  const user = userStore.get(login);
  if (!user) throw new Error(`No data for user:${login}`);
  return user;
}

type IssueListParams = { count?: number; state?: string } | undefined;

function selectIssues(params: IssueListParams): Issue[] {
  const issues =
    params?.state ? (stateIndex.get(params.state) ?? []) : masterList;
  return params?.count ? issues.slice(0, params.count) : issues;
}

/** The issue's author as currently stored; issues keep the user they were saved with. */
function latestUser(issue: Issue): User {
  return (
    (issue.user?.login ? userStore.get(issue.user.login) : undefined) ??
    issue.user
  );
}

/** The issue as served: with its author as currently stored. */
function withLatestUser(issue: Issue, user = latestUser(issue)): Issue {
  return user === issue.user ? issue : { ...issue, user };
}

/**
 * Each stored issue's JSON, with the user it was serialized with. Mutations
 * replace issue and user objects, so a stale entry never matches. This keeps
 * the server's serialization out of list fetches; the client still parses
 * every reply.
 */
const issueJSONCache = new WeakMap<Issue, { user: User; json: string }>();

function issueJSON(issue: Issue): string {
  const user = latestUser(issue);
  let cached = issueJSONCache.get(issue);
  if (cached?.user !== user) {
    cached = {
      user,
      json: JSON.stringify(withLatestUser(issue, user)),
    };
    issueJSONCache.set(issue, cached);
  }
  return cached.json;
}

function fetchIssueList(params?: IssueListParams): JSONReply {
  const issues = selectIssues(params);
  return new JSONReply(`[${issues.map(issueJSON).join(',')}]`, issues.length);
}

/**
 * For validation: apply each kind of mutation and compare the list replies
 * with a fresh serialization. Returns the first mismatch, or null.
 */
function checkIssueListJSON(): string | null {
  const steps: [string, () => unknown][] = [
    ['initial', () => undefined],
    [
      'updateUser',
      () => updateUser({ login: latestUser(masterList[0]).login, name: 'x' }),
    ],
    [
      'updateIssue',
      () => updateIssue({ number: masterList[1].number, title: 'x' }),
    ],
    [
      'move',
      () =>
        updateIssue({
          number: masterList[2].number,
          state: masterList[2].state === 'open' ? 'closed' : 'open',
        }),
    ],
    ['patchIssue', () => patchIssue(masterList[3].number, { title: 'y' })],
    [
      'createIssue',
      () => createIssue({ title: 'x', user: latestUser(masterList[0]) }),
    ],
    ['deleteIssue', () => deleteIssue({ number: masterList[4].number })],
  ];
  const lists: IssueListParams[] = [
    undefined,
    { state: 'open' },
    { count: 10 },
  ];
  for (const [name, step] of steps) {
    step();
    for (const params of lists) {
      const fresh = JSON.stringify(
        selectIssues(params).map(issue => withLatestUser(issue)),
      );
      if (fetchIssueList(params).json !== fresh)
        return `after ${name}, list ${JSON.stringify(params)} differs`;
    }
  }
  return null;
}

function fetchTickerList(): Ticker[] {
  return getFixtureTickers();
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
  fetchTickerList,
  createIssue,
  updateIssue,
  updateUser,
  deleteIssue,
  deleteUser,
  getIssue: ({ number }: { number: number }) => getIssue(number),
  patchIssue: ({ number, patch }: { number: number; patch: Partial<Issue> }) =>
    patchIssue(number, patch),
  seedIssueList: ({ issues }: { issues: Issue[] }) => seedIssueList(issues),
  checkIssueListJSON,
  holdMutationReplies: () => {
    holdMutations = true;
  },
  releaseMutationReplies: () => {
    holdMutations = false;
    for (const post of heldReplies.splice(0)) post();
  },
  setNetworkDelay: ({ ms }: { ms: number }) => {
    networkDelayMs = ms;
    networkSim = null;
  },
  setNetworkSim: ({
    config,
  }: {
    config: { baseLatencyMs: number; recordsPerMs: number } | null;
  }) => {
    networkSim = config;
  },
};

/** Messages without an `id` are control messages and get no reply. */
self.onmessage = (e: MessageEvent) => {
  const { id, method, params, mutation } = e.data as {
    id?: number;
    method: string;
    params: any;
    mutation?: boolean;
  };

  const fn = methods[method];
  if (id === undefined) {
    fn?.(params);
    return;
  }
  if (!fn) {
    respondError(id, `Unknown method: ${method}`);
    return;
  }

  try {
    const result = fn(params);
    respond(id, result === undefined ? null : result, !!mutation);
  } catch (err) {
    respondError(id, err instanceof Error ? err.message : String(err));
  }
};

import type { Issue, Label, User } from './types';

// ── WORKER SETUP ─────────────────────────────────────────────────────────

const worker = new Worker(new URL('./server.worker.ts', import.meta.url));

let nextId = 0;
const pending = new Map<
  number,
  { resolve: (v: any) => void; reject: (e: Error) => void }
>();

worker.onmessage = (e: MessageEvent) => {
  const { id, result, error } = e.data as {
    id: number;
    result?: string;
    error?: string;
  };
  const entry = pending.get(id);
  if (!entry) return;
  pending.delete(id);
  if (error) {
    entry.reject(new Error(error));
  } else {
    entry.resolve(result != null ? JSON.parse(result) : undefined);
  }
};

function sendRequest<T>(method: string, params?: any): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, method, params });
  });
}

// ── PENDING MUTATION TRACKING ────────────────────────────────────────────

const pendingMutations = new Set<Promise<unknown>>();

function sendMutation<T>(method: string, params?: any): Promise<T> {
  const p = sendRequest<T>(method, params);
  pendingMutations.add(p);
  p.finally(() => pendingMutations.delete(p));
  return p;
}

export function flushPendingMutations(): Promise<void> {
  if (pendingMutations.size === 0) return Promise.resolve();
  return Promise.allSettled([...pendingMutations]).then(() => {});
}

// ── READ ─────────────────────────────────────────────────────────────────

export function fetchIssue(params: { number: number }): Promise<Issue> {
  return sendRequest('fetchIssue', params);
}

export function fetchUser(params: { login: string }): Promise<User> {
  return sendRequest('fetchUser', params);
}

export function fetchIssueList(params?: {
  count?: number;
  state?: string;
}): Promise<Issue[]> {
  return sendRequest('fetchIssueList', params);
}

// ── CREATE ───────────────────────────────────────────────────────────────

export function createIssue(body: {
  title: string;
  user: User;
  labels?: Label[];
}): Promise<Issue> {
  return sendMutation('createIssue', body);
}

// ── UPDATE ───────────────────────────────────────────────────────────────

export function updateIssue(params: {
  number: number;
  title?: string;
  state?: Issue['state'];
  user?: User;
}): Promise<Issue> {
  return sendMutation('updateIssue', params);
}

export function updateUser(params: {
  login: string;
  name?: string;
}): Promise<User> {
  return sendMutation('updateUser', params);
}

// ── DELETE ────────────────────────────────────────────────────────────────

export function deleteIssue(params: {
  number: number;
}): Promise<{ id: number; number: number }> {
  return sendMutation('deleteIssue', params);
}

export function deleteUser(params: {
  login: string;
}): Promise<{ login: string }> {
  return sendMutation('deleteUser', params);
}

// ── DIRECT STORE ACCESS (pre-measurement setup) ─────────────────────────

export function getIssue(number: number): Promise<Issue | undefined> {
  return sendRequest('getIssue', { number });
}

export function patchIssue(
  number: number,
  patch: Partial<Issue>,
): Promise<void> {
  return sendRequest('patchIssue', { number, patch });
}

export function seedIssueList(issues: Issue[]): Promise<void> {
  return sendRequest('seedIssueList', { issues });
}

// ── CONTROL ──────────────────────────────────────────────────────────────

export function setNetworkDelay(ms: number): void {
  worker.postMessage({
    id: nextId++,
    method: 'setNetworkDelay',
    params: { ms },
  });
}

export function setMethodDelays(delays: Record<string, number>): void {
  worker.postMessage({
    id: nextId++,
    method: 'setMethodDelays',
    params: { delays },
  });
}

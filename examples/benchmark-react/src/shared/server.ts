import type { Author, Item } from './types';

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

export function fetchItem(params: { id: string }): Promise<Item> {
  return sendRequest('fetchItem', params);
}

export function fetchAuthor(params: { id: string }): Promise<Author> {
  return sendRequest('fetchAuthor', params);
}

export function fetchItemList(params?: {
  count?: number;
  status?: string;
}): Promise<Item[]> {
  return sendRequest('fetchItemList', params);
}

// ── CREATE ───────────────────────────────────────────────────────────────

export function createItem(body: {
  label: string;
  author: Author;
}): Promise<Item> {
  return sendMutation('createItem', body);
}

export function createAuthor(body: {
  login: string;
  name: string;
}): Promise<Author> {
  return sendMutation('createAuthor', body);
}

// ── UPDATE ───────────────────────────────────────────────────────────────

export function updateItem(params: {
  id: string;
  label?: string;
  status?: Item['status'];
  author?: Author;
}): Promise<Item> {
  return sendMutation('updateItem', params);
}

export function updateAuthor(params: {
  id: string;
  login?: string;
  name?: string;
}): Promise<Author> {
  return sendMutation('updateAuthor', params);
}

// ── DELETE ────────────────────────────────────────────────────────────────

export function deleteItem(params: { id: string }): Promise<{ id: string }> {
  return sendMutation('deleteItem', params);
}

export function deleteAuthor(params: { id: string }): Promise<{ id: string }> {
  return sendMutation('deleteAuthor', params);
}

// ── DIRECT STORE ACCESS (pre-measurement setup) ─────────────────────────

export function getItem(id: string): Promise<Item | undefined> {
  return sendRequest('getItem', { id });
}

export function patchItem(id: string, patch: Partial<Item>): Promise<void> {
  return sendRequest('patchItem', { id, patch });
}

export function seedItemList(items: Item[]): Promise<void> {
  return sendRequest('seedItemList', { items });
}

// ── CONTROL ──────────────────────────────────────────────────────────────

export function setNetworkDelay(ms: number): void {
  worker.postMessage({
    id: nextId++,
    method: 'setNetworkDelay',
    params: { ms },
  });
}

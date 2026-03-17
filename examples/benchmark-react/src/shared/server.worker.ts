/// <reference lib="webworker" />

import { FIXTURE_AUTHORS, FIXTURE_ITEMS } from './data';
import type { Author, Item } from './types';

declare const self: DedicatedWorkerGlobalScope;

// ── NETWORK DELAY ────────────────────────────────────────────────────────

let networkDelayMs = 0;

function respond(id: number, value: unknown) {
  const json = JSON.stringify(value);
  if (networkDelayMs <= 0) {
    self.postMessage({ id, result: json });
  } else {
    setTimeout(() => self.postMessage({ id, result: json }), networkDelayMs);
  }
}

function respondError(id: number, message: string) {
  self.postMessage({ id, error: message });
}

// ── IN-MEMORY STORES ─────────────────────────────────────────────────────

const itemStore = new Map<string, Item>();
const authorStore = new Map<string, Author>();
let masterList: Item[] = [];
const statusIndex = new Map<string, Item[]>();
const idToPosition = new Map<string, number>();

function rebuildStatusIndex() {
  statusIndex.clear();
  for (const item of masterList) {
    let list = statusIndex.get(item.status);
    if (!list) {
      list = [];
      statusIndex.set(item.status, list);
    }
    list.push(item);
  }
}

function rebuildPositionIndex() {
  idToPosition.clear();
  for (let i = 0; i < masterList.length; i++) {
    idToPosition.set(masterList[i].id, i);
  }
}

// Pre-seed with fixture data
for (const author of FIXTURE_AUTHORS) {
  authorStore.set(author.id, { ...author });
}
for (const item of FIXTURE_ITEMS) {
  const seeded: Item = { ...item, author: { ...item.author } };
  itemStore.set(item.id, seeded);
  masterList.push(seeded);
}
rebuildStatusIndex();
rebuildPositionIndex();

// ── READ ─────────────────────────────────────────────────────────────────

function fetchItem({ id }: { id: string }): Item {
  const item = itemStore.get(id);
  if (!item) throw new Error(`No data for item:${id}`);
  if (item.author?.id) {
    const latest = authorStore.get(item.author.id);
    if (latest && latest !== item.author) return { ...item, author: latest };
  }
  return item;
}

function fetchAuthor({ id }: { id: string }): Author {
  const author = authorStore.get(id);
  if (!author) throw new Error(`No data for author:${id}`);
  return author;
}

function fetchItemList(params?: { count?: number; status?: string }): Item[] {
  let items: Item[] =
    params?.status ? (statusIndex.get(params.status) ?? []) : masterList;
  if (params?.count) {
    items = items.slice(0, params.count);
  }
  items = items.map(item => {
    if (item.author?.id) {
      const latest = authorStore.get(item.author.id);
      if (latest && latest !== item.author) return { ...item, author: latest };
    }
    return item;
  });
  return items;
}

// ── CREATE ───────────────────────────────────────────────────────────────

let createItemCounter = 0;

function createItem(body: { label: string; author: Author }): Item {
  const id = `created-item-${createItemCounter++}`;
  const now = new Date().toISOString();
  const item: Item = {
    id,
    label: body.label,
    description: '',
    status: 'open',
    priority: 3,
    tags: [],
    createdAt: now,
    updatedAt: now,
    author: body.author,
  };
  itemStore.set(id, item);
  masterList.unshift(item);
  rebuildPositionIndex();
  const statusList = statusIndex.get(item.status);
  if (statusList) {
    statusList.unshift(item);
  } else {
    statusIndex.set(item.status, [item]);
  }
  return item;
}

let createAuthorCounter = 0;

function createAuthor(body: { login: string; name: string }): Author {
  const id = `created-author-${createAuthorCounter++}`;
  const author: Author = {
    id,
    login: body.login,
    name: body.name,
    avatarUrl: `https://avatars.example.com/u/${id}?s=64`,
    email: `${body.login}@example.com`,
    bio: '',
    followers: 0,
    createdAt: new Date().toISOString(),
  };
  authorStore.set(id, author);
  return author;
}

// ── UPDATE ───────────────────────────────────────────────────────────────

function updateItem(params: {
  id: string;
  label?: string;
  status?: Item['status'];
  author?: Author;
}): Item {
  const existing = itemStore.get(params.id);
  if (!existing) throw new Error(`No data for item:${params.id}`);
  const updated: Item = { ...existing, ...params };
  itemStore.set(params.id, updated);
  const idx = idToPosition.get(params.id) ?? -1;
  if (idx >= 0) masterList[idx] = updated;
  if (existing.status !== updated.status) {
    rebuildStatusIndex();
  } else {
    const sList = statusIndex.get(updated.status);
    if (sList) {
      const si = sList.indexOf(existing);
      if (si >= 0) sList[si] = updated;
    }
  }
  return updated;
}

function updateAuthor(params: {
  id: string;
  login?: string;
  name?: string;
}): Author {
  const existing = authorStore.get(params.id);
  if (!existing) throw new Error(`No data for author:${params.id}`);
  const updated: Author = { ...existing, ...params };
  authorStore.set(params.id, updated);
  return updated;
}

// ── DELETE ────────────────────────────────────────────────────────────────

function deleteItem({ id }: { id: string }): { id: string } {
  itemStore.delete(id);
  const idx = idToPosition.get(id) ?? -1;
  if (idx >= 0) {
    masterList.splice(idx, 1);
    rebuildPositionIndex();
  }
  rebuildStatusIndex();
  return { id };
}

function deleteAuthor({ id }: { id: string }): { id: string } {
  authorStore.delete(id);
  return { id };
}

// ── DIRECT STORE ACCESS ──────────────────────────────────────────────────

function getItem(id: string): Item | undefined {
  return itemStore.get(id);
}

function patchItem(id: string, patch: Partial<Item>): void {
  const existing = itemStore.get(id);
  if (!existing) return;
  const updated: Item = { ...existing, ...patch };
  itemStore.set(id, updated);
  const idx = idToPosition.get(id) ?? -1;
  if (idx >= 0) masterList[idx] = updated;
  if (existing.status !== updated.status) {
    rebuildStatusIndex();
  } else {
    const sList = statusIndex.get(updated.status);
    if (sList) {
      const si = sList.indexOf(existing);
      if (si >= 0) sList[si] = updated;
    }
  }
}

function seedItemList(items: Item[]): void {
  masterList = items;
  itemStore.clear();
  authorStore.clear();
  for (const item of items) {
    itemStore.set(item.id, item);
    if (item.author) authorStore.set(item.author.id, item.author);
  }
  rebuildStatusIndex();
  rebuildPositionIndex();
}

// ── MESSAGE HANDLER ──────────────────────────────────────────────────────

const MUTATION_METHODS = new Set([
  'createItem',
  'createAuthor',
  'updateItem',
  'updateAuthor',
  'deleteItem',
  'deleteAuthor',
  'patchItem',
  'seedItemList',
]);

const methods: Record<string, (params: any) => unknown> = {
  fetchItem,
  fetchAuthor,
  fetchItemList,
  createItem,
  createAuthor,
  updateItem,
  updateAuthor,
  deleteItem,
  deleteAuthor,
  getItem: ({ id }: { id: string }) => getItem(id),
  patchItem: ({ id, patch }: { id: string; patch: Partial<Item> }) =>
    patchItem(id, patch),
  seedItemList: ({ items }: { items: Item[] }) => seedItemList(items),
  setNetworkDelay: ({ ms }: { ms: number }) => {
    networkDelayMs = ms;
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
    respond(id, result === undefined ? null : result);
  } catch (err) {
    respondError(id, err instanceof Error ? err.message : String(err));
  }
};

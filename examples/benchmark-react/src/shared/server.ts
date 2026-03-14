import { FIXTURE_AUTHORS, FIXTURE_ITEMS } from './data';
import type { Author, Item } from './types';

// ── CONFIGURABLE NETWORK DELAY ──────────────────────────────────────────

let networkDelayMs = 0;

interface PendingDelay<T> {
  id: ReturnType<typeof setTimeout>;
  resolve: (v: T) => void;
  value: T;
}
const pendingDelays = new Set<PendingDelay<any>>();

function withDelay<T>(value: T): Promise<T> {
  if (networkDelayMs <= 0) return Promise.resolve(value);
  return new Promise<T>(resolve => {
    const entry: PendingDelay<T> = {
      id: setTimeout(() => {
        pendingDelays.delete(entry);
        resolve(value);
      }, networkDelayMs),
      resolve,
      value,
    };
    pendingDelays.add(entry);
  });
}

/**
 * Set simulated per-request network latency. Setting to 0 also flushes
 * (immediately resolves) any pending delayed responses so no Promises leak.
 */
export function setNetworkDelay(ms: number) {
  networkDelayMs = ms;
  if (ms === 0) {
    for (const entry of pendingDelays) {
      clearTimeout(entry.id);
      entry.resolve(entry.value);
    }
    pendingDelays.clear();
  }
}

/** Fake server: holds JSON response strings keyed by resource type + id */
export const jsonStore = new Map<string, string>();

// Pre-seed with fixture data
for (const item of FIXTURE_ITEMS) {
  jsonStore.set(`item:${item.id}`, JSON.stringify(item));
}
for (const author of FIXTURE_AUTHORS) {
  jsonStore.set(`author:${author.id}`, JSON.stringify(author));
}
jsonStore.set('item:list', JSON.stringify(FIXTURE_ITEMS));

// ── READ ────────────────────────────────────────────────────────────────

export function fetchItem({ id }: { id: string }): Promise<Item> {
  const json = jsonStore.get(`item:${id}`);
  if (!json) return Promise.reject(new Error(`No data for item:${id}`));
  const item: Item = JSON.parse(json);
  // Join latest author data (like a real DB join) so callers always
  // see the current author without eager propagation in updateAuthor.
  if (item.author?.id) {
    const authorJson = jsonStore.get(`author:${item.author.id}`);
    if (authorJson) {
      item.author = JSON.parse(authorJson);
    }
  }
  return withDelay(item);
}

export function fetchAuthor({ id }: { id: string }): Promise<Author> {
  const json = jsonStore.get(`author:${id}`);
  if (!json) return Promise.reject(new Error(`No data for author:${id}`));
  return withDelay(JSON.parse(json) as Author);
}

export function fetchItemList(params?: { count?: number }): Promise<Item[]> {
  const json = jsonStore.get('item:list');
  if (!json) return Promise.reject(new Error('No data for item:list'));
  const listItems: Item[] = JSON.parse(json);
  const sliced = params?.count ? listItems.slice(0, params.count) : listItems;
  // Join latest item + author data (like a real DB-backed API)
  const items = sliced.map(listItem => {
    const itemJson = jsonStore.get(`item:${listItem.id}`);
    const item: Item = itemJson ? JSON.parse(itemJson) : listItem;
    if (item.author?.id) {
      const authorJson = jsonStore.get(`author:${item.author.id}`);
      if (authorJson) {
        item.author = JSON.parse(authorJson);
      }
    }
    return item;
  });
  return withDelay(items);
}

// ── CREATE ──────────────────────────────────────────────────────────────

let createItemCounter = 0;

export function createItem(body: {
  label: string;
  author: Author;
}): Promise<Item> {
  const id = `created-item-${createItemCounter++}`;
  const item: Item = { id, label: body.label, author: body.author };
  const json = JSON.stringify(item);
  jsonStore.set(`item:${id}`, json);
  // Prepend to item:list so refetching the list returns the new item first
  const listJson = jsonStore.get('item:list');
  const list: Item[] = listJson ? JSON.parse(listJson) : [];
  list.unshift(item);
  jsonStore.set('item:list', JSON.stringify(list));
  return withDelay(JSON.parse(json) as Item);
}

let createAuthorCounter = 0;

export function createAuthor(body: {
  login: string;
  name: string;
}): Promise<Author> {
  const id = `created-author-${createAuthorCounter++}`;
  const author: Author = { id, login: body.login, name: body.name };
  const json = JSON.stringify(author);
  jsonStore.set(`author:${id}`, json);
  return withDelay(JSON.parse(json) as Author);
}

// ── UPDATE ──────────────────────────────────────────────────────────────

export function updateItem(params: {
  id: string;
  label?: string;
  author?: Author;
}): Promise<Item> {
  const existing = jsonStore.get(`item:${params.id}`);
  if (!existing)
    return Promise.reject(new Error(`No data for item:${params.id}`));
  const updated: Item = { ...JSON.parse(existing), ...params };
  const json = JSON.stringify(updated);
  jsonStore.set(`item:${params.id}`, json);
  return withDelay(JSON.parse(json) as Item);
}

/**
 * Updates the author record only. Item reads join the latest author via
 * fetchItem (like a real DB), so no eager O(n) propagation is needed.
 */
export function updateAuthor(params: {
  id: string;
  login?: string;
  name?: string;
}): Promise<Author> {
  const existing = jsonStore.get(`author:${params.id}`);
  if (!existing)
    return Promise.reject(new Error(`No data for author:${params.id}`));
  const updated: Author = { ...JSON.parse(existing), ...params };
  const json = JSON.stringify(updated);
  jsonStore.set(`author:${params.id}`, json);

  return withDelay(JSON.parse(json) as Author);
}

// ── DELETE ───────────────────────────────────────────────────────────────

export function deleteItem({ id }: { id: string }): Promise<{ id: string }> {
  jsonStore.delete(`item:${id}`);
  const listJson = jsonStore.get('item:list');
  if (listJson) {
    const list: Item[] = JSON.parse(listJson);
    jsonStore.set('item:list', JSON.stringify(list.filter(i => i.id !== id)));
  }
  return withDelay({ id });
}

export function deleteAuthor({ id }: { id: string }): Promise<{ id: string }> {
  jsonStore.delete(`author:${id}`);
  return withDelay({ id });
}

// ── SEEDING ─────────────────────────────────────────────────────────────

/** Seed items into the store. */
export function seedItems(items: Item[]): void {
  jsonStore.set('item:list', JSON.stringify(items));
  for (const item of items) {
    jsonStore.set(`item:${item.id}`, JSON.stringify(item));
    jsonStore.set(`author:${item.author.id}`, JSON.stringify(item.author));
  }
}

/** Seed a subset of fixture items for sorted view. */
export function seedItemList(items: Item[]): void {
  jsonStore.set('item:list', JSON.stringify(items));
}

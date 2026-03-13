import { FIXTURE_AUTHORS, FIXTURE_ITEMS } from './data';
import type { Author, Item } from './types';

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
  return Promise.resolve(JSON.parse(json));
}

export function fetchAuthor({ id }: { id: string }): Promise<Author> {
  const json = jsonStore.get(`author:${id}`);
  if (!json) return Promise.reject(new Error(`No data for author:${id}`));
  return Promise.resolve(JSON.parse(json));
}

export function fetchItemList(): Promise<Item[]> {
  const json = jsonStore.get('item:list');
  if (!json) return Promise.reject(new Error('No data for item:list'));
  return Promise.resolve(JSON.parse(json));
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
  return Promise.resolve(JSON.parse(json));
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
  return Promise.resolve(JSON.parse(json));
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
  return Promise.resolve(JSON.parse(json));
}

/**
 * Updates the author and all items that embed it (simulates a DB join --
 * subsequent GET /items/:id would return the fresh author data).
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

  // Propagate to all items embedding this author
  for (const [key, itemJson] of jsonStore) {
    if (!key.startsWith('item:') || key === 'item:list') continue;
    const item: Item = JSON.parse(itemJson);
    if (item.author?.id === params.id) {
      jsonStore.set(key, JSON.stringify({ ...item, author: updated }));
    }
  }

  return Promise.resolve(JSON.parse(json));
}

// ── DELETE ───────────────────────────────────────────────────────────────

export function deleteItem({ id }: { id: string }): Promise<{ id: string }> {
  jsonStore.delete(`item:${id}`);
  return Promise.resolve({ id });
}

export function deleteAuthor({ id }: { id: string }): Promise<{ id: string }> {
  jsonStore.delete(`author:${id}`);
  return Promise.resolve({ id });
}

// ── BULK SEEDING ────────────────────────────────────────────────────────

/** Seed bulk items into the store (for bulkIngest scenario). */
export function seedBulkItems(items: Item[]): void {
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

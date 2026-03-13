import type { Author, Item } from './types';

/** Sort items by label, optionally limiting to the first `limit` results. */
export function sortByLabel<T extends { label: string }>(
  items: T[],
  limit?: number,
): T[] {
  const sorted = [...items].sort((a, b) => a.label.localeCompare(b.label));
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Generate authors - shared across items to stress normalization.
 * Fewer authors than items means many items share the same author reference.
 */
export function generateAuthors(count: number): Author[] {
  const authors: Author[] = [];
  for (let i = 0; i < count; i++) {
    authors.push({
      id: `author-${i}`,
      login: `user${i}`,
      name: `User ${i}`,
    });
  }
  return authors;
}

/**
 * Generate items with nested author entities (shared references).
 * Items cycle through authors so many items share the same author.
 */
export function generateItems(count: number, authors: Author[]): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const author = authors[i % authors.length];
    items.push({
      id: `item-${i}`,
      label: `Item ${i}`,
      author: { ...author },
    });
  }
  return items;
}

/** Unique authors from fixture (for seeding and updateAuthor scenarios) */
export const FIXTURE_AUTHORS = generateAuthors(20);

/** Pre-generated fixture for benchmark - 10000 items, 20 shared authors */
export const FIXTURE_ITEMS = generateItems(10000, FIXTURE_AUTHORS);

/** O(1) item lookup by id (avoids linear scans inside measurement regions) */
export const FIXTURE_ITEMS_BY_ID = new Map(FIXTURE_ITEMS.map(i => [i.id, i]));

/** O(1) author lookup by id */
export const FIXTURE_AUTHORS_BY_ID = new Map(
  FIXTURE_AUTHORS.map(a => [a.id, a]),
);

/**
 * Generate fresh items/authors with distinct IDs for bulk ingestion scenarios.
 * Uses `fresh-` prefix so these don't collide with pre-seeded FIXTURE data.
 */
export function generateFreshData(
  itemCount: number,
  authorCount = 20,
): { items: Item[]; authors: Author[] } {
  const authors: Author[] = [];
  for (let i = 0; i < authorCount; i++) {
    authors.push({
      id: `fresh-author-${i}`,
      login: `freshuser${i}`,
      name: `Fresh User ${i}`,
    });
  }
  const items: Item[] = [];
  for (let i = 0; i < itemCount; i++) {
    const author = authors[i % authorCount];
    items.push({
      id: `fresh-item-${i}`,
      label: `Fresh Item ${i}`,
      author: { ...author },
    });
  }
  return { items, authors };
}

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
const STATUSES: Item['status'][] = ['open', 'closed', 'in_progress'];
const TAG_POOL = [
  'bug',
  'feature',
  'docs',
  'perf',
  'security',
  'ux',
  'refactor',
  'test',
  'infra',
  'deps',
];

export function generateAuthors(count: number): Author[] {
  const authors: Author[] = [];
  for (let i = 0; i < count; i++) {
    authors.push({
      id: `author-${i}`,
      login: `user${i}`,
      name: `User ${i}`,
      avatarUrl: `https://avatars.example.com/u/${i}?s=64`,
      email: `user${i}@example.com`,
      bio: `Software engineer #${i}. Likes open source and coffee.`,
      followers: (i * 137 + 42) % 10000,
      createdAt: new Date(2020, 0, 1 + (i % 365)).toISOString(),
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
    const created = new Date(2023, i % 12, 1 + (i % 28)).toISOString();
    items.push({
      id: `item-${i}`,
      label: `Item ${i}`,
      description: `Description for item ${i}: a moderately long text field that exercises serialization and storage overhead in the benchmark.`,
      status: STATUSES[i % STATUSES.length],
      priority: (i % 5) + 1,
      tags: [
        TAG_POOL[i % TAG_POOL.length],
        TAG_POOL[(i * 3 + 1) % TAG_POOL.length],
      ],
      createdAt: created,
      updatedAt: new Date(2024, i % 12, 1 + (i % 28)).toISOString(),
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
      avatarUrl: `https://avatars.example.com/u/fresh-${i}?s=64`,
      email: `freshuser${i}@example.com`,
      bio: `Fresh contributor #${i}.`,
      followers: (i * 89 + 17) % 5000,
      createdAt: new Date(2021, 6, 1 + (i % 28)).toISOString(),
    });
  }
  const items: Item[] = [];
  for (let i = 0; i < itemCount; i++) {
    const author = authors[i % authorCount];
    const created = new Date(2024, i % 12, 1 + (i % 28)).toISOString();
    items.push({
      id: `fresh-item-${i}`,
      label: `Fresh Item ${i}`,
      description: `Fresh item ${i} description with enough text to be realistic.`,
      status: STATUSES[i % STATUSES.length],
      priority: (i % 5) + 1,
      tags: [TAG_POOL[i % TAG_POOL.length]],
      createdAt: created,
      updatedAt: created,
      author: { ...author },
    });
  }
  return { items, authors };
}

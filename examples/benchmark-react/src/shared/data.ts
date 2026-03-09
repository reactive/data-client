import type { Author, Item } from './types';

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
export function generateItems(count: number, authorCount = 10): Item[] {
  const authors = generateAuthors(authorCount);
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const author = authors[i % authorCount];
    items.push({
      id: `item-${i}`,
      label: `Item ${i}`,
      author: { ...author },
    });
  }
  return items;
}

/** Pre-generated fixture for benchmark - 500 items, 20 shared authors */
export const FIXTURE_ITEMS = generateItems(500, 20);

/** Unique authors from fixture (for seeding and updateAuthor scenarios) */
export const FIXTURE_AUTHORS = generateAuthors(20);

import React from 'react';
import type { RowComponentProps } from 'react-window';

import type { Author, Item } from './types';

export const ITEM_HEIGHT = 30;
export const VISIBLE_COUNT = 40;
export const LIST_STYLE = { height: ITEM_HEIGHT * VISIBLE_COUNT } as const;
export const TRIPLE_LIST_STYLE = { display: 'flex', gap: 8 } as const;

const PRIORITY_LABELS = ['', 'low', 'med', 'high', 'crit', 'max'] as const;

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Expensive memoized author component. Simulates a realistic rich author
 * card: avatar color derivation, bio truncation, follower formatting, date
 * parsing. Libraries that preserve author referential equality skip this
 * entirely on unrelated updates; those that don't pay per row.
 */
function AuthorView({ author }: { author: Author }) {
  const hash = djb2(author.id + author.login + author.email + author.bio);
  const hue = hash % 360;
  const initials = author.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const bioWords = author.bio.split(/\s+/);
  const truncatedBio =
    bioWords.length > 12 ? bioWords.slice(0, 12).join(' ') + '…' : author.bio;
  const followerStr =
    author.followers >= 1000 ?
      `${(author.followers / 1000).toFixed(1)}k`
    : String(author.followers);
  const joinYear = new Date(author.createdAt).getFullYear();

  return (
    <span
      data-author
      data-author-id={author.id}
      style={{ color: `hsl(${hue},60%,40%)` }}
    >
      <span data-initials>{initials}</span>
      <span data-author-name>{author.name}</span>
      <span data-bio>{truncatedBio}</span>
      <span data-followers>{followerStr}</span>
      <span data-joined>{joinYear}</span>
    </span>
  );
}

/**
 * Row component — React Compiler auto-memoizes props/values. Libraries that
 * preserve referential equality benefit from the compiler's caching; those
 * that don't still re-execute the expensive AuthorView on every render.
 */
export function ItemRow({ item }: { item: Item }) {
  const tagStr = item.tags.join(', ');
  const prioLabel = PRIORITY_LABELS[item.priority] ?? item.priority;
  return (
    <div data-item-id={item.id} data-bench-item>
      <span data-label>{item.label}</span>
      <AuthorView author={item.author} />
      <span data-priority>{prioLabel}</span>
      <span data-status>{item.status}</span>
      <span data-tags>{tagStr}</span>
      <span data-desc>{item.description}</span>
    </div>
  );
}

/** Generic react-window row that renders an ItemRow from an items array. */
export function ItemsRow({
  index,
  style,
  items,
}: RowComponentProps<{ items: Item[] }>) {
  return (
    <div style={style}>
      <ItemRow item={items[index]} />
    </div>
  );
}

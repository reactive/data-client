import React from 'react';
import type { RowComponentProps } from 'react-window';

import type { Item } from './types';

export const ITEM_HEIGHT = 30;
export const VISIBLE_COUNT = 40;
export const LIST_STYLE = { height: ITEM_HEIGHT * VISIBLE_COUNT } as const;
export const TRIPLE_LIST_STYLE = { display: 'flex', gap: 8 } as const;

/**
 * Pure presentational component - no data-fetching logic.
 * Each library app wraps this with its own data-fetching hook.
 */
export function ItemRow({ item }: { item: Item }) {
  return (
    <div data-item-id={item.id} data-bench-item>
      <span data-label>{item.label}</span>
      <span data-author>{item.author.name}</span>
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

import React from 'react';

import type { Item } from './types';

export const ITEM_HEIGHT = 30;
export const VISIBLE_COUNT = 20;
export const LIST_STYLE = { height: ITEM_HEIGHT * VISIBLE_COUNT } as const;

/**
 * Pure presentational component - no data-fetching logic.
 * Each library app wraps this with its own data-fetching hook.
 */
export function ItemRow({ item }: { item: Item }) {
  return (
    <div data-item-id={item.id} data-bench-item>
      <span data-label>{item.label}</span>
      <span data-author>{item.author.login}</span>
    </div>
  );
}

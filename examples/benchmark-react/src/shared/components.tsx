import React from 'react';
import type { RowComponentProps } from 'react-window';

import type { Item } from './types';

export const ITEM_HEIGHT = 30;
export const VISIBLE_COUNT = 40;
export const LIST_STYLE = { height: ITEM_HEIGHT * VISIBLE_COUNT } as const;
export const TRIPLE_LIST_STYLE = { display: 'flex', gap: 8 } as const;

const PRIORITY_LABELS = ['', 'low', 'med', 'high', 'crit', 'max'] as const;

/**
 * Memoized row component. With referential equality (data-client, tanstack-query),
 * unchanged items skip this entirely. Without it (SWR, baseline), every row
 * re-renders on any list change — the extra render weight makes that visible.
 */
export const ItemRow = React.memo(function ItemRow({ item }: { item: Item }) {
  const tagStr = item.tags.join(', ');
  const prioLabel = PRIORITY_LABELS[item.priority] ?? item.priority;
  return (
    <div data-item-id={item.id} data-bench-item>
      <span data-label>{item.label}</span>
      <span data-author>{item.author.name}</span>
      <span data-priority>{prioLabel}</span>
      <span data-status>{item.status}</span>
      <span data-tags>{tagStr}</span>
      <span data-desc>{item.description}</span>
    </div>
  );
});

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

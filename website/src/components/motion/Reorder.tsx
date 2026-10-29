import React, {
  Component,
  createContext,
  useCallback,
  useContext,
  type RefCallback,
} from 'react';

import { prefersReducedMotion } from './glide';
import { measure, reorder, type Positions } from './reorder';
import type { Spring } from './spring';
import { springs } from './tokens';

const ItemsContext = createContext<Map<unknown, HTMLElement> | null>(null);

interface Props {
  /** Items only move when this changes (the list they're rendered from) */
  layoutDependency: unknown;
  spring?: Spring;
  children: React.ReactNode;
}

/**
 * Glides its items (`useReorderItem`) to wherever a change moves them: a
 * sort, a filter, a row moving to another group. It renders no element of
 * its own and knows nothing of the layout, so it fits any list: rows, table
 * rows, grid cells, board cards.
 *
 * Measures before React touches the DOM, so it must re-render with the
 * change it animates: put it where the list is read, and pass the list as
 * `layoutDependency`.
 */
export default class Reorder extends Component<Props> {
  private items = new Map<unknown, HTMLElement>();

  getSnapshotBeforeUpdate(prev: Props): Positions | null {
    if (
      Object.is(prev.layoutDependency, this.props.layoutDependency) ||
      prefersReducedMotion()
    )
      return null;
    return measure(this.items);
  }

  componentDidUpdate(_props: Props, _state: unknown, before: Positions | null) {
    if (before) reorder(before, this.items, this.props.spring ?? springs.brisk);
  }

  render() {
    return (
      <ItemsContext value={this.items}>{this.props.children}</ItemsContext>
    );
  }
}

/**
 * Ref making its element an item of the nearest `<Reorder>`. `key` names the
 * item across renders (its id), so it is followed even when React remounts
 * it elsewhere; keys share one space within a `<Reorder>`.
 */
export function useReorderItem(key: unknown): RefCallback<HTMLElement> {
  const items = useContext(ItemsContext);
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el || !items) return;
      items.set(key, el);
      return () => {
        if (items.get(key) === el) items.delete(key);
      };
    },
    [items, key],
  );
}

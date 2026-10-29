import React, {
  Component,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type RefCallback,
  type RefObject,
} from 'react';

import { draggable, sendHome, settle, type Carrier } from './drag';
import { prefersReducedMotion, type Point } from './glide';
import { measure, reorder, type Positions } from './reorder';
import type { Spring } from './spring';
import { springs } from './tokens';

export interface ItemOptions<V> {
  /** Lets the reader drag the item into a group (an item with a
   * `dropValue`); called with that group's value */
  onDrop?: (value: V) => void;
  /** Makes the item a group others can be dropped in, standing for this
   * value. A drop lands in the group, not at a place in it */
  dropValue?: V;
}
type Options = RefObject<ItemOptions<any>>;

const ReorderContext = createContext<Reorder | null>(null);

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
 * rows, grid cells, board cards. Items can also be dragged into groups.
 *
 * Measures before React touches the DOM, so it must re-render with the
 * change it animates: put it where the list is read, and pass the list as
 * `layoutDependency`.
 */
export default class Reorder extends Component<Props> {
  private items = new Map<unknown, HTMLElement>();
  private groups = new Map<HTMLElement, Options>();
  /** Items let go in another group, held where they were dropped until the
   * list changes */
  private dropped = new Set<HTMLElement>();

  getSnapshotBeforeUpdate(prev: Props): Positions | null {
    if (
      Object.is(prev.layoutDependency, this.props.layoutDependency) ||
      prefersReducedMotion()
    )
      return null;
    return measure(this.items);
  }

  componentDidUpdate(prev: Props, _state: unknown, before: Positions | null) {
    if (!Object.is(prev.layoutDependency, this.props.layoutDependency)) {
      for (const el of this.dropped) settle(el);
      this.dropped.clear();
    }
    if (before) reorder(before, this.items, this.spring());
  }

  render() {
    return <ReorderContext value={this}>{this.props.children}</ReorderContext>;
  }

  /** Joins `el` under `key`; returns the cleanup */
  add(
    key: unknown,
    el: HTMLElement,
    options: Options,
    { drags, group }: { drags: boolean; group: boolean },
  ) {
    this.items.set(key, el);
    if (group) this.groups.set(el, options);
    const undrag =
      drags ?
        draggable(el, () => this.carrier(el, options), this.spring)
      : undefined;
    return () => {
      undrag?.();
      this.groups.delete(el);
      if (this.items.get(key) === el) this.items.delete(key);
    };
  }

  private spring = () => this.props.spring ?? springs.brisk;

  /** Carrying `el` marks the groups it can go to (`data-drop-target`) and
   * the one under the pointer (`data-drop-over`) */
  private carrier(el: HTMLElement, options: Options): Carrier {
    // its own group isn't somewhere to go
    const targets = [...this.groups.keys()].filter(
      group => !group.contains(el),
    );
    let over: HTMLElement | undefined;
    return {
      lift() {
        for (const group of targets) group.dataset.dropTarget = '';
      },
      move(point) {
        const hit = groupAt(targets, point);
        if (hit === over) return;
        if (over) delete over.dataset.dropOver;
        if (hit) hit.dataset.dropOver = '';
        over = hit;
      },
      drop: point => {
        for (const group of targets) {
          delete group.dataset.dropTarget;
          delete group.dataset.dropOver;
        }
        const group = point && over;
        if (!group) return false;
        this.dropped.add(el);
        // a drop the list doesn't follow (nothing changed) goes back
        setTimeout(() => {
          if (this.dropped.delete(el) && el.isConnected)
            sendHome(el, this.spring());
        }, DROP_WAIT_MS);
        options.current.onDrop?.(this.groups.get(group)?.current.dropValue);
        return true;
      },
    };
  }
}

/**
 * Ref making its element an item of the nearest `<Reorder>`. `key` names the
 * item across renders (its id), so it is followed even when React remounts
 * it elsewhere; keys share one space within a `<Reorder>`. `options` make it
 * draggable, or a group to drag items into.
 */
export function useReorderItem<V>(
  key: unknown,
  options: ItemOptions<V> = {},
): RefCallback<HTMLElement> {
  const reorder = useContext(ReorderContext);
  const latest = useRef(options);
  // runs before a drop could read it
  useLayoutEffect(() => {
    latest.current = options;
  });
  const drags = !!options.onDrop;
  const group = options.dropValue !== undefined;
  return useCallback(
    (el: HTMLElement | null) => {
      if (el && reorder) return reorder.add(key, el, latest, { drags, group });
    },
    [reorder, key, drags, group],
  );
}

/** The innermost group under `point` */
function groupAt(groups: HTMLElement[], { x, y }: Point) {
  let hit: HTMLElement | undefined;
  for (const group of groups) {
    const { left, right, top, bottom } = group.getBoundingClientRect();
    if (x < left || x > right || y < top || y > bottom) continue;
    if (!hit || hit.contains(group)) hit = group;
  }
  return hit;
}

/** ms a drop waits for the list to change before going back */
const DROP_WAIT_MS = 500;

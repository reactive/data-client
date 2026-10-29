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

import { draggable, inHand, sendHome, settle, type Carrier } from './drag';
import { prefersReducedMotion } from './glide';
import { intoGroups } from './groups';
import { measure, reorder, type Positions } from './reorder';
import type { Spring } from './spring';
import { springs } from './tokens';

export interface ItemOptions {
  /** Lets the reader drag the item into a group (an item with a
   * `dropValue`); called with that group's value. The item stays where it
   * was let go until the list changes, or the promise it returns (a fetch)
   * settles without moving it */
  onDrop?: (value: any) => unknown;
  /** Makes the item a group others can be dropped in, standing for this
   * value (`undefined`: not a group). A drop lands in the group, not at a
   * place in it */
  dropValue?: unknown;
}
/** An item's latest options, read when a drag needs them */
type OptionsRef = RefObject<ItemOptions>;

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
  private groups = new Map<HTMLElement, OptionsRef>();
  /** Items let go in another group, held where they were dropped until the
   * list changes */
  private dropped = new Set<HTMLElement>();

  getSnapshotBeforeUpdate(prev: Props): Positions | null {
    if (!this.changed(prev) || prefersReducedMotion()) return null;
    return measure(loose(this.items));
  }

  componentDidUpdate(prev: Props, _state: unknown, before: Positions | null) {
    if (this.changed(prev)) {
      for (const el of this.dropped) settle(el);
      this.dropped.clear();
    }
    if (before) reorder(before, loose(this.items), this.spring());
  }

  render() {
    return <ReorderContext value={this}>{this.props.children}</ReorderContext>;
  }

  /** Joins `el` under `key`; returns the cleanup */
  add(
    key: unknown,
    el: HTMLElement,
    options: OptionsRef,
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

  private changed(prev: Props) {
    return !Object.is(prev.layoutDependency, this.props.layoutDependency);
  }

  private spring = () => this.props.spring ?? springs.brisk;

  /** Carrying `el` into a group hands its `dropValue` to `onDrop`, and
   * holds `el` where it was let go until the list follows */
  private carrier(el: HTMLElement, options: OptionsRef): Carrier {
    const carrier = intoGroups(el, this.groups.keys(), group => {
      // gone since it was hovered: nowhere to land
      const target = this.groups.get(group);
      if (!target) return false;
      this.hold(el, options.current.onDrop?.(target.current.dropValue));
      return true;
    });
    return {
      ...carrier,
      lift: () => {
        // picked up again before the list followed its last drop
        this.dropped.delete(el);
        carrier.lift();
      },
    };
  }

  private hold(el: HTMLElement, done: unknown) {
    this.dropped.add(el);
    // a drop the list didn't follow (nothing changed) goes back, once what
    // it set off has settled and React has committed what that caused
    const release = () =>
      setTimeout(() => {
        if (this.dropped.delete(el) && el.isConnected)
          sendHome(el, this.spring());
      });
    Promise.resolve(done).then(release, release);
  }
}

/**
 * Ref making its element an item of the nearest `<Reorder>`. `key` names the
 * item across renders (its id), so it is followed even when React remounts
 * it elsewhere; keys share one space within a `<Reorder>`. `options` make it
 * draggable, or a group to drag items into.
 */
export function useReorderItem(
  key: unknown,
  options: ItemOptions = {},
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

/** The items not in the reader's hand: a carried one stays under the
 * pointer whatever the list does */
function loose(items: Map<unknown, HTMLElement>) {
  return new Map([...items].filter(([, el]) => !inHand(el)));
}

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
  /** Lets the reader drag the item into a group (`useDropGroup`); called
   * with that group's value. The item stays where it was let go until the
   * list changes, or the promise it returns (a fetch) settles without moving
   * it */
  onDrop?: (value: any) => unknown;
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
  /** Groups to drop items in, with the value each stands for */
  private groups = new Map<HTMLElement, unknown>();
  /** Each group's item key, by its value: apart from the items' own keys,
   * and the same whichever element shows the group */
  private groupKeys = new Map<unknown, object>();
  /** Items let go in another group, by key: held where they were dropped
   * until the list changes, then settling on `springs.drop`; `done` is what
   * their latest drop set off */
  private held = new Map<
    unknown,
    { el: HTMLElement; done: Promise<unknown> }
  >();

  getSnapshotBeforeUpdate(prev: Props): Positions | null {
    if (!this.changed(prev) || prefersReducedMotion()) return null;
    return measure(loose(this.items));
  }

  componentDidUpdate(prev: Props, _state: unknown, before: Positions | null) {
    if (!this.changed(prev)) return;
    const own = new Map<unknown, Spring>();
    for (const [key, { el }] of this.held) {
      settle(el);
      own.set(key, springs.drop);
    }
    this.held.clear();
    if (before)
      reorder(
        before,
        loose(this.items),
        this.props.spring ?? springs.brisk,
        own,
      );
  }

  render() {
    return <ReorderContext value={this}>{this.props.children}</ReorderContext>;
  }

  /** Joins `el` under `key`, which the reader can carry into a group when
   * it has `options` (its latest); returns the cleanup */
  add(key: unknown, el: HTMLElement, options?: OptionsRef) {
    this.items.set(key, el);
    const undrag =
      options && draggable(el, () => this.carrier(key, el, options));
    return () => {
      undrag?.();
      if (this.items.get(key) === el) this.items.delete(key);
    };
  }

  /** Joins `el` as the group standing for `value`; returns the cleanup */
  addGroup(value: unknown, el: HTMLElement) {
    let key = this.groupKeys.get(value);
    if (!key) this.groupKeys.set(value, (key = {}));
    const leave = this.add(key, el);
    this.groups.set(el, value);
    return () => {
      this.groups.delete(el);
      leave();
    };
  }

  private changed(prev: Props) {
    return !Object.is(prev.layoutDependency, this.props.layoutDependency);
  }

  /** Carrying `el` into a group hands that group's value to `onDrop`, and
   * holds `el` where it was let go until the list follows */
  private carrier(key: unknown, el: HTMLElement, options: OptionsRef): Carrier {
    const carrier = intoGroups(el, this.groups.keys(), group => {
      // gone since it was hovered: nowhere to land
      if (!this.groups.has(group)) return false;
      this.hold(key, el, options.current.onDrop?.(this.groups.get(group)));
      return true;
    });
    return {
      ...carrier,
      lift: () => {
        // picked up again before the list followed its last drop
        this.held.delete(key);
        carrier.lift();
      },
    };
  }

  private hold(key: unknown, el: HTMLElement, result: unknown) {
    const done = Promise.resolve(result);
    this.held.set(key, { el, done });
    // a drop the list didn't follow (nothing changed) goes back, once what
    // it set off has settled and React has committed what that caused; an
    // earlier drop of the same item settling leaves this one held
    const release = () =>
      setTimeout(() => {
        if (this.held.get(key)?.done !== done) return;
        this.held.delete(key);
        if (el.isConnected) sendHome(el);
      });
    done.then(release, release);
  }
}

/**
 * Ref making its element an item of the nearest `<Reorder>`. `key` names the
 * item across renders (its id), so it is followed even when React remounts
 * it elsewhere; keys share one space within a `<Reorder>`. `onDrop` lets the
 * reader drag it into a group (`useDropGroup`).
 */
export function useReorderItem(
  key: unknown,
  options: ItemOptions = {},
): RefCallback<HTMLElement> {
  const list = useContext(ReorderContext);
  const latest = useRef(options);
  // runs before a drop could read it
  useLayoutEffect(() => {
    latest.current = options;
  });
  const drags = !!options.onDrop;
  return useCallback(
    (el: HTMLElement | null) => {
      if (el && list) return list.add(key, el, drags ? latest : undefined);
    },
    [list, key, drags],
  );
}

/**
 * Ref making its element a group of the nearest `<Reorder>` that items
 * (`useReorderItem` with `onDrop`) can be dragged into, standing for `value`:
 * a drop hands it to the item's `onDrop`. A drop lands in the group, not at a
 * place in it. The group is an item too, gliding as the list changes;
 * `value` names it across renders, apart from the items' keys, so it must
 * stay the same from one render to the next (an id, not an object).
 */
export function useDropGroup(value: unknown): RefCallback<HTMLElement> {
  const list = useContext(ReorderContext);
  return useCallback(
    (el: HTMLElement | null) => {
      if (el && list) return list.addGroup(value, el);
    },
    [list, value],
  );
}

/** The items not in the reader's hand: a carried one stays under the
 * pointer whatever the list does */
function loose(items: Map<unknown, HTMLElement>) {
  return new Map([...items].filter(([, el]) => !inHand(el)));
}

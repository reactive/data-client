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

import { glide, velocityOf, stop, ORIGIN, type Point } from './glide';
import type { Spring } from './spring';
import { springs } from './tokens';

/** How a member enters and leaves; absent for members that only move */
interface Presence {
  /** Leaving: slides out past the end of its container; its owner hides it */
  exiting: boolean;
}
type Members = Map<HTMLElement, RefObject<Presence | undefined>>;

interface Snapshot {
  /** Position on screen (including any glide in flight), parent-relative */
  at: Point;
  velocity: Point;
  /** Layout box (no transforms), to pin a presence where it was if it exits */
  box: Box;
}
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Move {
  el: HTMLElement;
  from: Point;
  to: Point;
  velocity?: Point;
}

const GroupContext = createContext<Members | null>(null);

interface Props {
  /** Layout only animates when this changes (e.g. the open state) */
  layoutDependency: unknown;
  spring?: Spring;
  children: React.ReactNode;
}

/**
 * Animates layout changes React commits inside it: members glide from where
 * they were on screen to their new place (FLIP, translate only, so content
 * never distorts), and `<Reveal>`s slide in and out along their container's
 * flow. One spring drives every member, so things that move together read as
 * one physical object. A change mid-flight keeps each member's momentum.
 *
 * Measures before React touches the DOM, so it must re-render with the
 * change it animates: put it where that state lives, and pass that state as
 * `layoutDependency`.
 */
export default class MotionGroup extends Component<Props> {
  private members: Members = new Map();

  getSnapshotBeforeUpdate(prev: Props): Map<HTMLElement, Snapshot> | null {
    if (Object.is(prev.layoutDependency, this.props.layoutDependency))
      return null;
    const snapshots = new Map<HTMLElement, Snapshot>();
    // reduced motion: nothing to measure, everything lands in place
    if (prefersReducedMotion()) return snapshots;
    for (const el of this.members.keys()) {
      snapshots.set(el, {
        at: parentRelative(el),
        velocity: velocityOf(el),
        box: {
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        },
      });
    }
    return snapshots;
  }

  componentDidUpdate(
    _props: unknown,
    _state: unknown,
    snapshots: Map<HTMLElement, Snapshot> | null,
  ) {
    if (!snapshots) return;
    if (prefersReducedMotion()) {
      // land in place; a reopened exit rejoins the layout
      for (const [el, { current }] of this.members) {
        stop(el);
        if (!current?.exiting) unpin(el);
      }
      return;
    }
    const { spring = springs.smooth } = this.props;
    // settle the final layout before measuring anything; a presence shown
    // again (it was hidden, not unmounted) rejoins the layout
    for (const [el, { current }] of this.members) {
      stop(el);
      const before = snapshots.get(el);
      if (before && current?.exiting) pin(el, before.box);
      else unpin(el);
    }
    // measure everything, then start animations (one style recalc)
    const moves: Move[] = [];
    for (const [el, { current: presence }] of this.members) {
      const before = snapshots.get(el);
      if (!before) {
        // just mounted: a presence arrives from the end of its container's flow
        if (presence) moves.push({ el, from: exitOffset(el), to: ORIGIN });
        continue;
      }
      const at = parentRelative(el);
      moves.push({
        el,
        from: { x: before.at.x - at.x, y: before.at.y - at.y },
        to: presence?.exiting ? exitOffset(el) : ORIGIN,
        velocity: before.velocity,
      });
    }
    for (const { el, ...path } of moves) glide(el, spring, path);
  }

  render() {
    return (
      <GroupContext value={this.members}>{this.props.children}</GroupContext>
    );
  }
}

/** Ref joining an element to the nearest `<MotionGroup>` */
export function useMember(presence?: Presence): RefCallback<HTMLElement> {
  const members = useContext(GroupContext);
  const latest = useRef(presence);
  // runs before the group's componentDidUpdate in the same commit
  useLayoutEffect(() => {
    latest.current = presence;
  });
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el || !members) return;
      members.set(el, latest);
      return () => {
        members.delete(el);
      };
    },
    [members],
  );
}

/**
 * Whether the nearest `<MotionGroup>` would glide `el` when the layout
 * changes; if not, changes land at once
 */
export function useWillGlide(): (el: HTMLElement) => boolean {
  const members = useContext(GroupContext);
  return useCallback(
    el =>
      !!members && typeof el.animate === 'function' && !prefersReducedMotion(),
    [members],
  );
}

// members are mounted while the group measures them, so they have a parent
function parentOf(el: HTMLElement) {
  return el.parentElement as HTMLElement;
}

function parentRelative(el: HTMLElement): Point {
  const rect = el.getBoundingClientRect();
  const parent = parentOf(el).getBoundingClientRect();
  return { x: rect.left - parent.left, y: rect.top - parent.top };
}

/** Just past the end of the parent's main axis (reversed and RTL aware) */
function exitOffset(el: HTMLElement): Point {
  const parent = parentOf(el);
  const { flexDirection, direction } = getComputedStyle(parent);
  const column = flexDirection.startsWith('column');
  const towardStart =
    flexDirection.endsWith('reverse') !== (!column && direction === 'rtl');
  const [pos, size, extent] =
    column ?
      [el.offsetTop, el.offsetHeight, parent.clientHeight]
    : [el.offsetLeft, el.offsetWidth, parent.clientWidth];
  const distance = towardStart ? -(pos + size) : Math.max(extent - pos, size);
  return column ? { x: 0, y: distance } : { x: distance, y: 0 };
}

const unpinned = new WeakMap<HTMLElement, string>();
/** Takes an exiting element out of flow, so siblings take its space at once */
function pin(el: HTMLElement, { left, top, width, height }: Box) {
  if (!unpinned.has(el)) unpinned.set(el, el.style.cssText);
  Object.assign(el.style, {
    position: 'absolute',
    boxSizing: 'border-box',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
}
function unpin(el: HTMLElement) {
  const cssText = unpinned.get(el);
  if (cssText === undefined) return;
  el.style.cssText = cssText;
  unpinned.delete(el);
}

// same as @docusaurus/theme-common's, but safe without matchMedia (jsdom)
export function prefersReducedMotion() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Ref for an element that glides to its new place instead of jumping */
export function useLayoutMotion() {
  return useMember();
}

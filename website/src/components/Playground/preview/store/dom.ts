import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { ChangeKind } from './actionGroups';
import { prefersReducedMotion, springEasing, springs } from '../../../motion';

/** The element in `scope` whose `data-<key>` is `value`; compares the
 * attribute, so ids need no selector escaping */
export const byData = (scope: ParentNode, key: 'id' | 'table', value: string) =>
  [...scope.querySelectorAll<HTMLElement>(`[data-${key}]`)].find(
    el => el.dataset[key] === value,
  );

export type Axis = 'x' | 'y';

/** Each axis's names for a box's edge, its length, and its scroll */
export const AXES = {
  x: {
    start: 'left',
    extent: 'width',
    size: 'scrollWidth',
    scroll: 'scrollLeft',
    client: 'clientWidth',
  },
  y: {
    start: 'top',
    extent: 'height',
    size: 'scrollHeight',
    scroll: 'scrollTop',
    client: 'clientHeight',
  },
} as const;

/** Where `el`'s edge is in the viewport, on `axis` */
export const startOf = (el: Element, axis: Axis) =>
  el.getBoundingClientRect()[AXES[axis].start];

/** Where `el` sits in `scroller`'s scrolled content on `axis`, in px */
export const offsetIn = (
  scroller: HTMLElement,
  el: Element,
  axis: Axis = 'y',
) => startOf(el, axis) - startOf(scroller, axis) + scroller[AXES[axis].scroll];

const smooth = springEasing(springs.smooth);

/** Moves in from `direction` (1: the right, -1: the left) */
export function slide(el: HTMLElement, direction: 1 | -1) {
  if (typeof el.animate !== 'function' || prefersReducedMotion()) return;
  el.animate(
    [
      { opacity: 0, translate: `${direction * 24}px 0` },
      { opacity: 1, translate: '0 0' },
    ],
    smooth,
  );
}

/** `ref`'s content width, `initial` until measured; re-renders only when
 * it changes */
export function useWidth(
  ref: React.RefObject<HTMLElement | null>,
  initial = 560,
) {
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** A change's color, as every view marks it */
export const kindColor = (kind: ChangeKind) => `var(--store-kind-${kind})`;

/** Marks a row with the change the diff shows for it: its bar takes the
 * change's color (`.row[data-change]` in store.module.css) */
export const changeProps = (kind: ChangeKind | undefined) =>
  kind && {
    'data-change': kind,
    style: { '--store-change': kindColor(kind) } as React.CSSProperties,
  };

/** Highlights the rows in `scope` that `kindOf` names a change of, for a
 * moment, in that change's color */
export function flash(
  scope: HTMLElement,
  kindOf: (id: string) => ChangeKind | undefined,
) {
  if (typeof scope.animate !== 'function' || prefersReducedMotion()) return;
  for (const row of scope.querySelectorAll<HTMLElement>('[data-id]')) {
    const kind = kindOf(row.dataset.id!);
    if (!kind) continue;
    row.animate(
      [
        {
          backgroundColor: `color-mix(in srgb, ${kindColor(kind)} 30%, transparent)`,
        },
        { backgroundColor: 'transparent' },
      ],
      { duration: 1400, easing: 'ease-out' },
    );
  }
}

/** A level's scroll box, passed as the element itself rather than a ref:
 * the level attaches it only after its children's effects first run, so an
 * effect reading a ref would find nothing and never look again, while one
 * that depends on the element runs again once it is there */
export type Scroller = HTMLElement | null;

/** The spring scrolls underway (a Timeline catching up), by scroller */
export const springing = new WeakMap<Element, number>();
export function stopSpring(el: Element) {
  cancelAnimationFrame(springing.get(el) ?? 0);
  springing.delete(el);
}

/** An overflow style that scrolls */
const SCROLLABLE = /auto|scroll/;

/** Scrolls `row` just into view of `scroller`, and of any scroller between
 * them (an open row's steps, the Timeline's sideways lane), leaving it be
 * where it already shows */
export function revealIn(scroller: HTMLElement, row: HTMLElement) {
  for (let box = row.parentElement; box; box = box.parentElement) {
    const outer = box === scroller;
    const { overflowX, overflowY } = getComputedStyle(box);
    const top =
      outer || SCROLLABLE.test(overflowY) ?
        scrollToShow(box, row, 'y')
      : undefined;
    const left =
      SCROLLABLE.test(overflowX) ? scrollToShow(box, row, 'x') : undefined;
    // inner ones jump, so the outer one measures where the row ends up;
    // a catch-up underway would scroll it away again
    if (top !== undefined || left !== undefined) {
      stopSpring(box);
      box.scrollTo({ top, left, behavior: outer ? 'smooth' : 'instant' });
    }
    if (outer) return;
  }
}

/** Where `box` scrolls on `axis` to just show `el`, undefined when it shows
 * already */
function scrollToShow(box: HTMLElement, el: Element, axis: Axis) {
  const { extent, scroll, client } = AXES[axis];
  const from = offsetIn(box, el, axis);
  const to = from + el.getBoundingClientRect()[extent];
  return (
    from < box[scroll] ? from
    : to > box[scroll] + box[client] ? to - box[client]
    : undefined
  );
}

/** keydown for an element acting as a button: Enter or Space on the element
 * itself (not on a chip inside it) runs `activate` */
export const onActivateKey =
  (activate: () => void) => (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

/** Keeps keyboard focus from falling to the page as a change removes or
 * turns off the control pressed inside `ref` (a step to the end of a row,
 * "Live"): `hold()` right before the change, and after the render focus
 * goes to a step (`data-step`) still on in `ref`, or `ref` itself. Only while `ref`
 * holds focus (a pointer press need not focus a button); the change renders
 * before the next frame, so a hold can't go stale */
export function useHoldFocus(ref: React.RefObject<HTMLElement | null>) {
  const held = useRef(false);
  const hold = useCallback(() => {
    if (!ref.current?.contains(document.activeElement)) return;
    held.current = true;
    requestAnimationFrame(() => (held.current = false));
  }, [ref]);
  useLayoutEffect(() => {
    if (!held.current) return;
    held.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const el = ref.current;
    (el?.querySelector<HTMLElement>('[data-step]:not(:disabled)') ?? el)?.focus(
      {
        preventScroll: true,
      },
    );
  });
  return hold;
}

/** `set` with `key` added, or removed when it is in: a toggle's state */
export function toggled<T>(set: ReadonlySet<T>, key: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(key)) next.add(key);
  return next;
}

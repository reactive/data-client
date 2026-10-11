import React, { useCallback, useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion, springEasing, springs } from '../../../motion';
import type { ChangeKind } from './actionGroups';

/** What `scrollToRow` leaves above a revealed row, for the sticky section
 * header (`.sectionHeader` in store.module.css) */
const HEADER_HEIGHT = 32;

/** The element in `scope` whose `data-<key>` is `value`; compares the
 * attribute, so ids need no selector escaping */
export const byData = (scope: ParentNode, key: 'id' | 'table', value: string) =>
  [...scope.querySelectorAll<HTMLElement>(`[data-${key}]`)].find(
    el => el.dataset[key] === value,
  );

/** Where `el` sits in `scroller`'s scrolled content, in px */
export const offsetIn = (scroller: HTMLElement, el: Element) =>
  el.getBoundingClientRect().top -
  scroller.getBoundingClientRect().top +
  scroller.scrollTop;

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

/** Highlights the rows in `scope` that `kindOf` names a change of, for a
 * moment, in that change's color (as the diff's bar marks it): an added row
 * green, a removed one red, any other yellow */
export function flash(
  scope: HTMLElement,
  kindOf: (id: string) => ChangeKind | true | undefined,
) {
  if (typeof scope.animate !== 'function' || prefersReducedMotion()) return;
  for (const row of scope.querySelectorAll<HTMLElement>('[data-id]')) {
    const kind = kindOf(row.dataset.id!);
    if (!kind) continue;
    row.animate(
      [
        {
          backgroundColor:
            FLASH[kind === true ? '' : kind] ?? 'var(--store-flash)',
        },
        { backgroundColor: 'transparent' },
      ],
      { duration: 1400, easing: 'ease-out' },
    );
  }
}
const FLASH: Partial<Record<ChangeKind | '', string>> = {
  added: 'var(--store-flash-added)',
  removed: 'var(--store-flash-removed)',
};

/** Scrolls row `id` into view below the section header and focuses it */
export function scrollToRow(scroller: HTMLElement, id: string) {
  const row = byData(scroller, 'id', id);
  if (!row) return;
  scroller.scrollTo({
    top: Math.max(0, offsetIn(scroller, row) - HEADER_HEIGHT),
    behavior: 'smooth',
  });
  row.focus({ preventScroll: true });
}

/** Scrolls `row` just into view of `scroller`, and of any scroller between
 * them (an open row's steps), leaving it be where it already shows */
export function revealIn(scroller: HTMLElement, row: HTMLElement) {
  for (let box = row.parentElement; box; box = box.parentElement) {
    const outer = box === scroller;
    if (outer || /auto|scroll/.test(getComputedStyle(box).overflowY)) {
      const top = offsetIn(box, row);
      const bottom = top + row.getBoundingClientRect().height;
      const to =
        top < box.scrollTop ? top
        : bottom > box.scrollTop + box.clientHeight ? bottom - box.clientHeight
        : undefined;
      // inner ones jump, so the outer one measures where the row ends up
      if (to !== undefined)
        box.scrollTo({ top: to, behavior: outer ? 'smooth' : 'instant' });
    }
    if (outer) return;
  }
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

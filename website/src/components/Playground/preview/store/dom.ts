import type React from 'react';

import { prefersReducedMotion, springEasing, springs } from '../../../motion';

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

/** Highlights the rows in `scope` whose id passes `test`, for a moment */
export function flash(scope: HTMLElement, test: (id: string) => boolean) {
  if (typeof scope.animate !== 'function' || prefersReducedMotion()) return;
  for (const row of scope.querySelectorAll<HTMLElement>('[data-id]')) {
    if (!test(row.dataset.id!)) continue;
    row.animate(
      [
        { backgroundColor: 'var(--store-flash)' },
        { backgroundColor: 'transparent' },
      ],
      { duration: 1400, easing: 'ease-out' },
    );
  }
}

/** Scrolls row `id` into view below the section header and focuses it
 * (unless `focus` is off) */
export function scrollToRow(
  scroller: HTMLElement,
  id: string,
  { focus = true }: { focus?: boolean } = {},
) {
  const row = byData(scroller, 'id', id);
  if (!row) return;
  scroller.scrollTo({
    top: Math.max(0, offsetIn(scroller, row) - HEADER_HEIGHT),
    behavior: 'smooth',
  });
  if (focus) row.focus({ preventScroll: true });
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

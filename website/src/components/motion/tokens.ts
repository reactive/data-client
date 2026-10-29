import type { Spring } from './spring';

/**
 * The site's motion vocabulary. Pick by what moves, not by milliseconds; the
 * same names are CSS custom properties (`var(--motion-snappy)`), see css.ts.
 */
export const springs = {
  /** Small, light things: arrows, chips, toggles */
  snappy: { duration: 0.25, bounce: 0.15 },
  /** Items trading places in a list (`<Reorder>`): quick off the mark, with
   * a touch of settle so a row lands rather than stops */
  brisk: { duration: 0.3, bounce: 0.1 },
  /** An item the reader lets go, settling into its place: it was already
   * near, in their hand, so it lands at once */
  drop: { duration: 0.2, bounce: 0.1 },
  /** Panels and drawers that carry content; no overshoot past their edge */
  smooth: { duration: 0.4, bounce: 0 },
  /** A big surface pulled a long way, so the travel reads as deliberate:
   * the Playground's Store drawer over the code (Playground/styles.module.css) */
  drawer: { duration: 0.55, bounce: 0 },
} as const satisfies Record<string, Spring>;

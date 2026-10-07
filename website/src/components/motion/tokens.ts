import type { Spring } from './spring';

/**
 * The site's motion vocabulary. Pick by what moves, not by milliseconds; the
 * same names are CSS custom properties (`var(--motion-snappy)`), see css.ts.
 */
export const springs = {
  /** Small, light things: arrows, chips, toggles */
  snappy: { duration: 0.25, bounce: 0.15 },
  /** Panels and drawers that carry content; no overshoot past their edge */
  smooth: { duration: 0.4, bounce: 0 },
} as const satisfies Record<string, Spring>;

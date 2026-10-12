/** A demo a playground plays by itself: what to do, step by step, as a
 * reader would (see "Auto-run" in ../../README.md). Plain data, so docs can
 * declare it. */
export type AutoRunScript = readonly Step[];

export type Step = StepTiming &
  (
    | { click: Target }
    /** Appends `text` to an input, a character at a time */
    | { type: Target; text: string }
    /** Holds still, letting a change sink in */
    | { wait: number }
    /** Opens or closes the Store, without changing the reader's own choice */
    | { store: 'open' | 'close' }
  );

interface StepTiming {
  /** ms before the step acts (default `STEP_DELAY` in ./player) */
  delay?: number;
}

/** An element in the playground: a CSS selector, or one of
 * - `{ selector, hasText }`: the first match whose text includes `hasText`
 * - `{ label }`: the control a `<label>` with exactly this text names
 *
 * `in` scopes the search (default the live preview's result). Only visible
 * elements match, and a step waits for its target to appear.
 */
export type Target =
  | string
  | ({ in?: Scope } & (
      { selector: string; hasText?: string } | { label: string }
    ));

export type Scope = 'preview' | 'store' | 'playground';

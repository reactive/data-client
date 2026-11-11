/** Under 1 ms, so a burst stays below the next millisecond as long as it can;
 * a power of two, so adding it to a millisecond timestamp is exact */
const STEP = 2 ** -10;
const WALL = 0;
const ORDERED = 1;
/** Last Date.now() and last returned time. A typed array stores the doubles in
 * place; module-level `let`s would allocate a heap number on every write */
const last = new Float64Array(2);

/** Date.now(), but later than every earlier call
 *
 * Fetches, sets and resets compare these times, so ones started in the same
 * millisecond must keep their order.
 */
export function orderedNow(now = Date.now()): number {
  const next = last[ORDERED] + STEP;
  // a clock set back (or fake timers) starts over from now;
  // `!(next > now)` rather than `next <= now` so one NaN can't stick
  last[ORDERED] = now < last[WALL] || !(next > now) ? now : next;
  last[WALL] = now;
  return last[ORDERED];
}

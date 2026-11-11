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
export function orderedNow(): number {
  const now = Date.now();
  // a clock set back (or fake timers) starts over from now
  last[ORDERED] = now < last[WALL] ? now : Math.max(now, last[ORDERED] + STEP);
  last[WALL] = now;
  return last[ORDERED];
}

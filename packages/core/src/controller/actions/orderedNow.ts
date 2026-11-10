/** Under 1 ms, so a burst stays below the next millisecond as long as it can;
 * a power of two, so adding it to a millisecond timestamp is exact */
const STEP = 2 ** -10;
let lastWall = 0;
let lastOrdered = 0;

/** Date.now(), but later than every earlier call
 *
 * Fetches, sets and resets compare these times, so ones started in the same
 * millisecond must keep their order.
 */
export function orderedNow(): number {
  const now = Date.now();
  // a clock set back (or fake timers) starts over from now
  lastOrdered = now < lastWall ? now : Math.max(now, lastOrdered + STEP);
  lastWall = now;
  return lastOrdered;
}

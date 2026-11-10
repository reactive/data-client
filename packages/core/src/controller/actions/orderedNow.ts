/** Smaller than 1 ms, and exact in binary for millisecond timestamps */
const STEP = 2 ** -10;
let lastWall = 0;
let last = 0;

/** Date.now(), but later than every earlier call
 *
 * Fetches, sets and resets compare these times, so ones started in the same
 * millisecond must keep their order.
 */
export function orderedNow(): number {
  const now = Date.now();
  // a clock set back (or fake timers) starts over from now
  last = now < lastWall ? now : Math.max(now, last + STEP);
  lastWall = now;
  return last;
}

let last = 0;

/** Date.now(), but later than earlier calls in the same millisecond
 *
 * Fetches, sets and resets compare these times, so ones started in the same
 * millisecond must keep their order.
 */
export function orderedNow(): number {
  const now = Date.now();
  // a clock set back (or fake timers) starts over from now
  last = now > last || last - now >= 1 ? now : last + 2 ** -10;
  return last;
}

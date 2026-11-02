import { glide, stop, velocityOf, ORIGIN, type Point } from './glide';
import { springEasing, type Spring } from './spring';

/** Elements that move as a list changes, each under a key that stays the
 * same from one render to the next (an item's id), even when the element
 * doesn't */
export type Items = ReadonlyMap<unknown, HTMLElement>;

/** Where an item was on screen (including any glide in flight), and how
 * fast it was moving; with its element, its list and its size, so if the
 * change takes it away it can fade out where it was */
export interface Position {
  at: Point;
  velocity: Point;
  el: HTMLElement;
  parent: HTMLElement | null;
  width: number;
  height: number;
}
export type Positions = ReadonlyMap<unknown, Position>;

/** Reads where `items` are, before a change moves them */
export function measure(items: Items): Positions {
  const positions = new Map<unknown, Position>();
  for (const [key, el] of items) {
    const { left, top, width, height } = el.getBoundingClientRect();
    positions.set(key, {
      at: { x: left, y: top },
      velocity: velocityOf(el),
      el,
      parent: el.parentElement,
      width,
      height,
    });
  }
  return positions;
}

/**
 * Glides each item from where `before` saw its key to where it is now (FLIP,
 * `translate` only, on the compositor), so an item React put under another
 * parent travels there too. An item inside another that moves rides along
 * with it, and only travels the rest of the way itself; a key `before` lacks
 * fades in, marked `data-arrived` for a style that calls attention to it
 * (unless an item moves in with it, or it takes the exact spot of a key
 * that just left: the same item under a new id, like an optimistic create
 * the server answered). A key that left fades out where it was, as the
 * others glide into its place. Items crossing the others (going past one,
 * not only into a gap) are `data-traveling` until they land. `own` gives some keys their own spring
 * (an item the reader dropped settles quicker). Layout-agnostic: it reads
 * only where items are on screen.
 */
export function reorder(
  before: Positions,
  items: Items,
  spring: Spring,
  own: ReadonlyMap<unknown, Spring> = new Map(),
) {
  // the final layout, without glides (or their marks) in flight, before
  // measuring it
  for (const el of items.values()) {
    stop(el);
    land(el);
  }
  const moves = new Map<
    HTMLElement,
    { offset: Point; velocity: Point; spring: Spring; was: Point; at: Point }
  >();
  const arrivals: HTMLElement[] = [];
  const left = [...before]
    .filter(([key]) => !items.has(key))
    .map(([, position]) => position);
  for (const [key, el] of items) {
    const was = before.get(key);
    if (!was) {
      if (!takeSpot(left, positionOf(el))) arrivals.push(el);
      continue;
    }
    const at = positionOf(el);
    moves.set(el, {
      offset: { x: was.at.x - at.x, y: was.at.y - at.y },
      velocity: was.velocity,
      spring: own.get(key) ?? spring,
      was: was.at,
      at,
    });
  }
  // every read is done: start the animations
  const glides = [...moves].map(([el, { offset, velocity, spring }]) => {
    const carrier = carrierOf(el, moves);
    const carried = carrier && moves.get(carrier)?.offset;
    const from =
      carried ? { x: offset.x - carried.x, y: offset.y - carried.y } : offset;
    return { el, from, velocity, spring, length: distance(from) };
  });
  let farthest = 0;
  for (const { length } of glides) farthest = Math.max(farthest, length);
  for (const { el, from, velocity, spring, length } of glides) {
    const animation = glide(el, spring, { from, to: ORIGIN, velocity });
    if (animation && crosses(length, farthest) && passesAnother(el, moves))
      travel(el, animation);
  }
  // an arrival holding an item that moves in (a row into a group that
  // wasn't there) shows at once, or its fade would hide that item's glide
  const fades = arrivals.filter(
    el => !glides.some(({ el: item }) => el.contains(item)),
  );
  for (const position of left) leave(position);
  if (!fades.length) return;
  const timing = springEasing(spring);
  for (const el of fades) arrive(el, timing);
}

const ARRIVE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

function arrive(el: HTMLElement, timing: KeyframeAnimationOptions) {
  if (typeof el.animate !== 'function') return;
  el.animate(ARRIVE, timing);
  // until the style that calls attention to it is over (a move restarts a
  // CSS animation)
  el.dataset.arrived = '';
  const over = () => delete el.dataset.arrived;
  el.addEventListener('animationend', over, { once: true });
  el.addEventListener('animationcancel', over, { once: true });
}

// quicker than the glide into its place, so its text is mostly gone before
// the item taking its place gets there (they'd overprint)
const LEAVE: Keyframe[] = [
  { opacity: 1 },
  { opacity: 0, translate: '-12px 0' },
];
const LEAVE_TIMING: KeyframeAnimationOptions = {
  duration: 160,
  easing: 'ease-out',
  fill: 'forwards',
};

/** Puts an item that left back where it was, out of the flow (so the
 * others still take its place) and out of reach, while it fades out */
function leave({ el, parent, at, width, height }: Position) {
  // React kept it (it moved under another key), or its list left too
  if (el.isConnected || !parent?.isConnected) return;
  if (typeof el.animate !== 'function') return;
  stop(el);
  land(el);
  delete el.dataset.arrived;
  el.inert = true;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'absolute',
    boxSizing: 'border-box',
    margin: '0',
    left: '0',
    top: '0',
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: 'none',
    // over the others gliding into its place (a crossing one is lifted)
    zIndex: '2',
    // put back, it would play its CSS entrance again
    animation: 'none',
  });
  parent.append(el);
  const origin = positionOf(el);
  el.style.left = `${at.x - origin.x}px`;
  el.style.top = `${at.y - origin.y}px`;
  const gone = () => el.remove();
  el.animate(LEAVE, LEAVE_TIMING).finished.then(gone, gone);
}

/** Whether a move crosses the others: at least half as long as the
 * longest (the row going to another group, not the rows it nudges), and
 * more than a nudge itself */
const crosses = (length: number, farthest: number) =>
  length >= farthest / 2 && length > NUDGE;
/** px: a move this short crosses nothing */
const NUDGE = 1;

/** Whether `el` changed sides with another item that stayed (it went past
 * it), not only slid into a gap one left or out of the way of one that came */
function passesAnother(
  el: HTMLElement,
  items: ReadonlyMap<HTMLElement, { was: Point; at: Point }>,
) {
  const { was, at } = items.get(el)!;
  for (const [other, them] of items) {
    if (other === el || other.contains(el) || el.contains(other)) continue;
    for (const axis of ['x', 'y'] as const) {
      const before = side(was[axis] - them.was[axis]);
      const after = side(at[axis] - them.at[axis]);
      if (before && after && before !== after) return true;
    }
  }
  return false;
}
const side = (d: number) => (Math.abs(d) <= NUDGE ? 0 : Math.sign(d));

/** Items crossing the others while they glide, marked `data-traveling` so
 * their style can lift them over the rest */
const travels = new WeakMap<HTMLElement, Animation>();
export function travel(el: HTMLElement, animation: Animation) {
  travels.set(el, animation);
  el.dataset.traveling = '';
  // a glide another reorder replaced leaves the newer mark alone
  const arrived = () => {
    if (travels.get(el) === animation) land(el);
  };
  animation.finished.then(arrived, arrived);
}
function land(el: HTMLElement) {
  if (!travels.delete(el)) return;
  delete el.dataset.traveling;
}

const distance = ({ x, y }: Point) => Math.hypot(x, y);

/** Whether `at` is where one of `spots` was (removing it, so it's taken
 * once) */
function takeSpot(spots: Position[], at: Point) {
  const i = spots.findIndex(
    ({ at: spot }) => distance({ x: spot.x - at.x, y: spot.y - at.y }) <= NUDGE,
  );
  if (i !== -1) spots.splice(i, 1);
  return i !== -1;
}

function positionOf(el: HTMLElement): Point {
  const { left, top } = el.getBoundingClientRect();
  return { x: left, y: top };
}

/** The nearest moving item `el` is inside, if any */
function carrierOf(el: HTMLElement, moving: ReadonlyMap<HTMLElement, unknown>) {
  for (let up = el.parentElement; up; up = up.parentElement)
    if (moving.has(up)) return up;
}

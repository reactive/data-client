import { glide, stop, velocityOf, ORIGIN, type Point } from './glide';
import { springEasing, type Spring } from './spring';

/** Elements that move as a list changes, each under a key that stays the
 * same from one render to the next (an item's id), even when the element
 * doesn't */
export type Items = ReadonlyMap<unknown, HTMLElement>;

/** Where an item was on screen (including any glide in flight), and how
 * fast it was moving */
export interface Position {
  at: Point;
  velocity: Point;
}
export type Positions = ReadonlyMap<unknown, Position>;

/** Reads where `items` are, before a change moves them */
export function measure(items: Items): Positions {
  const positions = new Map<unknown, Position>();
  for (const [key, el] of items)
    positions.set(key, { at: positionOf(el), velocity: velocityOf(el) });
  return positions;
}

/**
 * Glides each item from where `before` saw its key to where it is now (FLIP,
 * `translate` only, on the compositor), so an item React put under another
 * parent travels there too. An item inside another that moves rides along
 * with it, and only travels the rest of the way itself; a key `before` lacks
 * fades in. Items crossing the others are `data-traveling` until they land.
 * Layout-agnostic: it reads only where items are on screen.
 */
export function reorder(before: Positions, items: Items, spring: Spring) {
  // the final layout, without glides (or their marks) in flight, before
  // measuring it
  for (const el of items.values()) {
    stop(el);
    land(el);
  }
  const moves = new Map<HTMLElement, { offset: Point; velocity: Point }>();
  const arrivals: HTMLElement[] = [];
  for (const [key, el] of items) {
    const was = before.get(key);
    if (!was) {
      arrivals.push(el);
      continue;
    }
    const at = positionOf(el);
    moves.set(el, {
      offset: { x: was.at.x - at.x, y: was.at.y - at.y },
      velocity: was.velocity,
    });
  }
  // every read is done: start the animations
  const glides = [...moves].map(([el, { offset, velocity }]) => {
    const carrier = carrierOf(el, moves);
    const carried = carrier && moves.get(carrier)?.offset;
    const from =
      carried ? { x: offset.x - carried.x, y: offset.y - carried.y } : offset;
    return { el, from, velocity };
  });
  const crosses = crossing(glides.map(({ from }) => distance(from)));
  glides.forEach(({ el, from, velocity }, i) => {
    const animation = glide(el, spring, { from, to: ORIGIN, velocity });
    if (animation && crosses[i]) travel(el, animation);
  });
  if (!arrivals.length) return;
  const timing = springEasing(spring);
  for (const el of arrivals) el.animate?.(ARRIVE, timing);
}

const ARRIVE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

/** Which moves cross the others: those at least half as long as the
 * longest (the row going to another group, not the rows it nudges), and
 * more than a nudge themselves */
function crossing(distances: number[]) {
  let farthest = 0;
  for (const d of distances) farthest = Math.max(farthest, d);
  return distances.map(d => d >= farthest / 2 && d > NUDGE);
}
/** px: a move this short crosses nothing */
const NUDGE = 1;

/** Items crossing the others while they glide, marked `data-traveling` so
 * their style can lift them over the rest */
const travels = new WeakMap<HTMLElement, Animation>();
function travel(el: HTMLElement, animation: Animation) {
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

function positionOf(el: HTMLElement): Point {
  const { left, top } = el.getBoundingClientRect();
  return { x: left, y: top };
}

/** The nearest moving item `el` is inside, if any */
function carrierOf(el: HTMLElement, moving: ReadonlyMap<HTMLElement, unknown>) {
  for (let up = el.parentElement; up; up = up.parentElement)
    if (moving.has(up)) return up;
}

import {
  sampleSpring,
  springAt,
  SAMPLE_RATE,
  type Spring,
  type SpringState,
} from './spring';

export interface Point {
  x: number;
  y: number;
}
export const ORIGIN: Point = { x: 0, y: 0 };

interface Glide {
  animation: Animation;
  spring: Spring;
  /** Where each axis started, relative to the target */
  start: [x: SpringState, y: SpringState];
}
const glides = new WeakMap<Element, Glide>();

/**
 * Springs `el`'s CSS `translate` from `from` to `to` (px) on the compositor.
 * Keyframes are sampled from the spring per axis, so a glide that interrupts
 * another keeps its momentum (`velocity`, px/s) in both directions.
 */
export function glide(
  el: HTMLElement,
  spring: Spring,
  { from, to, velocity = ORIGIN }: { from: Point; to: Point; velocity?: Point },
): Animation | undefined {
  stop(el);
  // no Web Animations (e.g. jsdom): land in place
  if (typeof el.animate !== 'function') return;
  if (from.x === to.x && from.y === to.y && !velocity.x && !velocity.y) return;
  const start = (['x', 'y'] as const).map(axis => ({
    offset: from[axis] - to[axis],
    velocity: velocity[axis],
  })) as Glide['start'];
  const [xs, ys] = start.map(axis => sampleSpring(spring, axis, PRECISION));
  const frames = Math.max(xs.length, ys.length);
  const keyframes = Array.from({ length: frames }, (_, i) => ({
    translate: `${to.x + (xs[i] ?? 0)}px ${to.y + (ys[i] ?? 0)}px`,
  }));
  const animation = el.animate(keyframes, {
    duration: ((frames - 1) / SAMPLE_RATE) * 1000,
    // hold an off-target end (exits) until the caller removes the element
    fill: to.x || to.y ? 'forwards' : 'none',
  });
  glides.set(el, { animation, spring, start });
  return animation;
}

/** How fast `el`'s glide is moving it right now (px/s) */
export function velocityOf(el: Element): Point {
  const current = glides.get(el);
  if (!current || current.animation.playState === 'finished') return ORIGIN;
  const { animation, spring, start } = current;
  const t = Number(animation.currentTime ?? 0) / 1000;
  const [x, y] = start.map(axis => springAt(spring, axis, t).velocity);
  return { x, y };
}

/**
 * Resolves once nothing moves `el`: now if it is still, else when its glide
 * finishes. A glide cancelled for another (a retarget) hands over to it.
 */
export function settled(el: Element): Promise<void> {
  const animation = glides.get(el)?.animation;
  if (animation?.playState !== 'running') return Promise.resolve();
  return animation.finished.then(
    () => undefined,
    () => settled(el),
  );
}

/** Ends `el`'s glide, snapping it back to its layout position */
export function stop(el: Element) {
  glides.get(el)?.animation.cancel();
  glides.delete(el);
}

/** Sub-pixel: settles once the remaining motion is invisible */
const PRECISION = 0.25;

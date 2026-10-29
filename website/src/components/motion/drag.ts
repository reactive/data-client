import { glide, prefersReducedMotion, stop, ORIGIN, type Point } from './glide';
import type { Spring } from './spring';

/** What carrying one element does, from lifting it to letting go */
export interface Carrier {
  /** It came off the page and follows the pointer */
  lift(): void;
  /** The pointer moved while carrying it (viewport coordinates) */
  move(point: Point): void;
  /**
   * Let go over `point`, or put back (Escape, a lost pointer) with none.
   * True when the drop took: the element stays where it was let go until
   * the caller `settle()`s it in its new place; false sends it home.
   */
  drop(point: Point | null): boolean;
}

/**
 * Lets the reader pick `el` up and carry it: a mouse or pen lifts it once it
 * moves a few px, a finger after a still press-and-hold (so a swipe still
 * scrolls). It follows the pointer by `translate`, marked `data-dragging`,
 * even as the page scrolls under it. Presses on its controls stay theirs.
 * Returns the cleanup.
 */
export function draggable(
  el: HTMLElement,
  carrier: () => Carrier,
  spring: () => Spring,
): () => void {
  const onDown = (down: PointerEvent) => {
    if (active || down.button !== 0 || !down.isPrimary) return;
    if ((down.target as Element).closest(CONTROLS)) return;
    active = pickUp(el, down, carrier(), spring);
  };
  // a carried touch must not scroll the page; the listener has to be in
  // place (and not passive) before the touch starts
  const onTouchMove = (e: TouchEvent) => {
    if (active && carried.has(el)) e.preventDefault();
  };
  // a held finger otherwise opens the context menu; an image would start
  // the browser's own drag
  const onHold = (e: Event) => {
    if (active) e.preventDefault();
  };
  el.dataset.draggable = '';
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('contextmenu', onHold);
  el.addEventListener('dragstart', onHold);
  return () => {
    delete el.dataset.draggable;
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('contextmenu', onHold);
    el.removeEventListener('dragstart', onHold);
  };
}

/** Ends a drop that took: the element leaves the spot it was let go at for
 * its layout position (from which a `reorder()` glides it) */
export function settle(el: HTMLElement) {
  el.style.translate = '';
  carried.delete(el);
  delete el.dataset.dragging;
}

/** Glides an element let go of back to its layout position */
export function sendHome(el: HTMLElement, spring: Spring) {
  const from = carried.get(el) ?? ORIGIN;
  settle(el);
  if (prefersReducedMotion()) return;
  const animation = glide(el, spring, { from, to: ORIGIN });
  if (!animation) return;
  // lifted over the others until it lands, unless picked up again
  el.dataset.dragging = '';
  const landed = () => {
    if (!carried.has(el)) delete el.dataset.dragging;
  };
  animation.finished.then(landed, landed);
}

/** The press being followed: one at a time */
let active: (() => void) | undefined;
/** Elements off the page, by how far they're carried from their layout
 * position */
const carried = new WeakMap<HTMLElement, Point>();

function pickUp(
  el: HTMLElement,
  down: PointerEvent,
  carrier: Carrier,
  spring: () => Spring,
) {
  const { pointerId } = down;
  const touch = down.pointerType === 'touch';
  const start = clientOf(down);
  let last = start;
  /** Where the pointer holds el, once lifted */
  let anchor: Point | undefined;
  const hold = touch ? setTimeout(lift, HOLD_MS) : undefined;

  function lift() {
    // held where it shows, even mid-glide
    const { left, top } = el.getBoundingClientRect();
    anchor = { x: start.x - left, y: start.y - top };
    carried.set(el, ORIGIN);
    stop(el);
    el.dataset.dragging = '';
    carrier.lift();
    follow();
  }
  function follow() {
    if (!anchor) return;
    // where layout puts it now: a scroll moves that, not the pointer
    const offset = carried.get(el) ?? ORIGIN;
    const { left, top } = el.getBoundingClientRect();
    const next = {
      x: last.x - anchor.x - (left - offset.x),
      y: last.y - anchor.y - (top - offset.y),
    };
    carried.set(el, next);
    el.style.translate = `${next.x}px ${next.y}px`;
    carrier.move(last);
  }
  function end(dropped: boolean) {
    clearTimeout(hold);
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onCancel);
    removeEventListener('keydown', onKey);
    removeEventListener('scroll', follow, true);
    active = undefined;
    if (anchor && !dropped) sendHome(el, spring());
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    last = clientOf(e);
    if (anchor) return follow();
    const moved = Math.hypot(last.x - start.x, last.y - start.y);
    if (moved <= (touch ? TOUCH_SLOP : SLOP)) return;
    // a finger moving before the hold is a swipe: the page scrolls
    if (touch) end(false);
    else lift();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    if (!anchor) return end(false);
    // the press ends in a click on whatever is under it; it was a drag
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, true));
    end(carrier.drop(last));
  };
  const onCancel = (e: PointerEvent) => {
    if (e.pointerId === pointerId) putBack();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && anchor) putBack();
  };
  function putBack() {
    if (anchor) carrier.drop(null);
    end(false);
  }

  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onCancel);
  addEventListener('keydown', onKey);
  addEventListener('scroll', follow, { capture: true, passive: true });
  return putBack;
}

/** Presses that work the element's controls rather than carry it */
const CONTROLS = 'input, select, textarea, button, a[href], [contenteditable]';
/** px a mouse or pen moves before it lifts (less is a click) */
const SLOP = 4;
/** px a held finger may drift and still lift */
const TOUCH_SLOP = 8;
/** ms a finger holds still to lift (a long press, short of the system's) */
const HOLD_MS = 250;

const clientOf = (e: PointerEvent): Point => ({ x: e.clientX, y: e.clientY });

function swallow(e: Event) {
  e.preventDefault();
  e.stopPropagation();
}

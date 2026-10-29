import { glide, prefersReducedMotion, stop, ORIGIN, type Point } from './glide';
import { travel } from './reorder';
import type { Spring } from './spring';

/** What carrying one element does, from lifting it to letting go */
export interface Carrier {
  /** It came off the page and follows the pointer */
  lift(): void;
  /** The pointer moved while carrying it (viewport coordinates) */
  move(point: Point): void;
  /**
   * Let go where it last moved. True when the drop took: the element stays
   * where it was let go until the caller `settle()`s it in its new place;
   * false sends it home.
   */
  drop(): boolean;
  /** Put back without a drop (Escape, a lost pointer); it goes home */
  cancel(): void;
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
    if (press || down.button !== 0 || !down.isPrimary) return;
    const control = (down.target as Element).closest(CONTROLS);
    if (control && el.contains(control)) return;
    press = { el, putBack: follow(el, down, carrier(), spring) };
  };
  // a carried touch must not scroll the page; the listener has to be in
  // place (and not passive) before the touch starts
  const onTouchMove = (e: TouchEvent) => {
    if (inHand(el)) e.preventDefault();
  };
  // a held finger otherwise opens the context menu; an image would start
  // the browser's own drag
  const onHold = (e: Event) => {
    if (press?.el === el) e.preventDefault();
  };
  el.dataset.draggable = '';
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('contextmenu', onHold);
  el.addEventListener('dragstart', onHold);
  return () => {
    // unmounted mid-press: nothing is carried any more
    if (press?.el === el) press.putBack();
    delete el.dataset.draggable;
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('contextmenu', onHold);
    el.removeEventListener('dragstart', onHold);
  };
}

/** Whether the reader is carrying `el` right now */
export const inHand = (el: HTMLElement) => press?.el === el && carried.has(el);

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
  // lifted over the others until it lands
  if (animation) travel(el, animation);
}

/** The press being followed (one at a time) */
let press: { el: HTMLElement; putBack: () => void } | undefined;
/** Elements off the page, by how far they're carried from their layout
 * position */
const carried = new WeakMap<HTMLElement, Point>();

/** Follows the press `down` on `el`: lifts it, carries it, lets it go.
 * Returns what puts it back */
function follow(
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
  /** It went somewhere: a finger held still and let go is a tap */
  let moved = false;
  const hold = touch ? setTimeout(lift, HOLD_MS) : undefined;

  function lift() {
    // held where it shows, even mid-glide
    const { left, top } = el.getBoundingClientRect();
    anchor = { x: start.x - left, y: start.y - top };
    // a drop still held where it was let go is carried on from there
    if (!carried.has(el)) carried.set(el, ORIGIN);
    stop(el);
    el.dataset.dragging = '';
    carrier.lift();
    carry();
  }
  function carry() {
    if (!anchor) return;
    // where layout puts it now: a scroll moves that, not the pointer
    const offset = carried.get(el) ?? ORIGIN;
    const { left, top } = el.getBoundingClientRect();
    const next = {
      x: last.x - anchor.x - (left - offset.x),
      y: last.y - anchor.y - (top - offset.y),
    };
    // the carrier reads where its targets are before this writes
    carrier.move(last);
    carried.set(el, next);
    el.style.translate = `${next.x}px ${next.y}px`;
  }
  function end(dropped: boolean) {
    clearTimeout(hold);
    listening.abort();
    press = undefined;
    if (anchor && !dropped) sendHome(el, spring());
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    last = clientOf(e);
    const distance = Math.hypot(last.x - start.x, last.y - start.y);
    if (anchor) {
      moved ||= distance > SLOP;
      return carry();
    }
    if (distance <= (touch ? TOUCH_SLOP : SLOP)) return;
    // a finger moving before the hold is a swipe: the page scrolls
    if (touch) return end(false);
    moved = true;
    lift();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    if (!moved) return putBack();
    // the press ends in a click on whatever is under it; it was a drag
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, true));
    let took = false;
    try {
      took = carrier.drop();
    } finally {
      end(took);
    }
  };
  const onCancel = (e: PointerEvent) => {
    if (e.pointerId === pointerId) putBack();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && anchor) putBack();
  };
  function putBack() {
    if (anchor) carrier.cancel();
    end(false);
  }

  const listening = new AbortController();
  const { signal } = listening;
  addEventListener('pointermove', onMove, { signal });
  addEventListener('pointerup', onUp, { signal });
  addEventListener('pointercancel', onCancel, { signal });
  addEventListener('keydown', onKey, { signal });
  addEventListener('scroll', carry, { capture: true, passive: true, signal });
  return putBack;
}

/** Presses that work the element's controls rather than carry it */
const CONTROLS = 'input, select, textarea, button, a[href], [contenteditable]';
/** px a press moves before it's a drag (less is a click or tap) */
const SLOP = 4;
/** px a finger may drift while it holds still to lift */
const TOUCH_SLOP = 8;
/** ms a finger holds still to lift (a long press, short of the system's) */
const HOLD_MS = 250;

const clientOf = (e: PointerEvent): Point => ({ x: e.clientX, y: e.clientY });

function swallow(e: Event) {
  e.preventDefault();
  e.stopPropagation();
}

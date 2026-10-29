import styles from './autorun.module.css';
import type { Stage } from './player';
import type { Scope } from './script';
import { prefersReducedMotion, springEasing, springs } from '../../../motion';
import { revealIn } from '../store/dom';
import type { ShowStore } from '../store/storeView';

/** Acts on one playground's DOM as a reader would, with untrusted events
 * (so the yield listeners in ./useAutoRun.ts tell them from the reader's) and
 * never `focus()`, which would take the page's focus from the reader.
 *
 * The pointer lives in a layer appended to `root`, removed by `end()`.
 */
export function createStage(root: HTMLElement, showStore: ShowStore): Stage {
  const layer = document.createElement('div');
  layer.className = styles.layer;
  root.append(layer);
  let pointer: HTMLElement | undefined;
  let at = { x: 0, y: 0 };
  let pointedAt: HTMLElement | undefined;

  /** Puts the pointer's tip on `el`'s center at once (in the layer's
   * coordinates, which scroll with the page); false when it was there
   * already */
  const place = (el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    const origin = layer.getBoundingClientRect();
    at = {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    };
    if (!pointer) {
      pointer = document.createElement('div');
      pointer.className = styles.pointer;
      pointer.innerHTML = POINTER_SVG;
      layer.append(pointer);
      // the first point fades in where it is
      void pointer.offsetWidth;
      pointer.dataset.shown = '';
    }
    const previous = pointer.style.translate;
    pointer.style.translate = `${at.x - origin.left}px ${at.y - origin.top}px`;
    return pointer.style.translate !== previous;
  };
  /** Moves the pointer onto `el`: placed there at once, then animated in from
   * where it was drawn by the difference, so it lands on the target however
   * the target moves meanwhile */
  const glide = (el: HTMLElement) => {
    const from = pointer?.getBoundingClientRect();
    const moved = place(el);
    if (from && moved && canAnimate()) {
      const to = pointer!.getBoundingClientRect();
      pointer!.animate(
        [
          {
            transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`,
          },
          { transform: 'none' },
        ],
        springEasing(springs.smooth),
      );
    }
    return moved;
  };
  const canAnimate = () =>
    typeof pointer?.animate === 'function' && !prefersReducedMotion();
  /** A press: a ring spreads from the tip */
  const ring = () => {
    if (canAnimate()) pointer!.animate(PRESS, PRESS_TIMING);
  };
  // the target can move under the pointer: content growing above the layer
  // (the Store opening), a sticky Store header as the page scrolls, a
  // scroller gliding to it. Follow it, unless a render took it away (it would
  // measure at the viewport's corner)
  const follow = () => {
    if (pointedAt?.isConnected && visible(pointedAt)) place(pointedAt);
  };
  const resized =
    typeof ResizeObserver === 'function' ?
      new ResizeObserver(follow)
    : undefined;
  resized?.observe(root);
  const scrolled = { capture: true, passive: true };
  document.addEventListener('scroll', follow, scrolled);

  return {
    find(target) {
      const { in: scope = 'preview', ...match } =
        typeof target === 'string' ? { selector: target } : target;
      const within = scopeOf(root, scope);
      if (!within) return null;
      if ('label' in match) {
        for (const label of within.querySelectorAll('label')) {
          if (label.textContent?.trim() !== match.label) continue;
          const control =
            label.control ??
            label.parentElement?.querySelector('input, textarea, select');
          if (control instanceof HTMLElement && visible(control))
            return control;
        }
        return null;
      }
      for (const el of within.querySelectorAll<HTMLElement>(match.selector)) {
        if (match.hasText && !el.textContent?.includes(match.hasText)) continue;
        if (visible(el)) return el;
      }
      return null;
    },

    point(el) {
      // root only bounds the walk: the scrollers inside it do the moving
      revealIn(root, el);
      revealOnPage(el);
      pointedAt = el;
      return glide(el);
    },

    click(el) {
      ring();
      const init = {
        bubbles: true,
        cancelable: true,
        composed: true,
        button: 0,
        clientX: at.x,
        clientY: at.y,
      };
      const Pointer =
        typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
      const pointerInit = { ...init, pointerType: 'mouse', isPrimary: true };
      el.dispatchEvent(new Pointer('pointerdown', pointerInit));
      el.dispatchEvent(new MouseEvent('mousedown', init));
      el.dispatchEvent(new Pointer('pointerup', pointerInit));
      el.dispatchEvent(new MouseEvent('mouseup', init));
      el.click();
    },

    append(el, text) {
      // React tracks the value it last set: write through the native setter
      // so its onChange sees the change
      const proto =
        el instanceof HTMLTextAreaElement ?
          HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const input = el as HTMLInputElement;
      Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(
        input,
        input.value + text,
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    store(open, { pressed, view } = {}) {
      if (pressed) ring();
      // not the toggle's own click, which would save the reader's choice
      showStore(open, view);
    },

    end() {
      resized?.disconnect();
      document.removeEventListener('scroll', follow, scrolled);
      layer.dataset.ended = '';
      setTimeout(() => layer.remove(), END_MS);
    },
  };
}

/** ms: the layer's fade out (`--motion-snappy`) */
const END_MS = springEasing(springs.snappy).duration;
/** The click: a ring spreading from the tip */
const PRESS: Keyframe[] = [
  { opacity: 0.5, scale: 0.3 },
  { opacity: 0, scale: 1.4 },
];
const PRESS_TIMING: KeyframeAnimationOptions = {
  ...springEasing(springs.snappy),
  pseudoElement: '::before',
};

function scopeOf(root: HTMLElement, scope: Scope) {
  switch (scope) {
    case 'playground':
      return root;
    case 'store':
      return root.querySelector<HTMLElement>('[data-store-panel]');
    default:
      return root.querySelector<HTMLElement>('.playground-preview');
  }
}

/** Scrolls the page to `el` if it's out of sight past one edge (the Store
 * opens above the preview on a phone; replay brings the preview back), clear
 * of the sticky navbar. Past both edges, it already fills the view, so it
 * stays put. The pointer is placed relative to the page, so it scrolls
 * along. */
export function revealOnPage(el: HTMLElement) {
  const navbar = document.querySelector('.navbar')?.getBoundingClientRect();
  const { top, bottom } = el.getBoundingClientRect();
  // a navbar hidden on scroll reports a bottom above the viewport
  const above = top < Math.max(0, navbar?.bottom ?? 0);
  const below = bottom > innerHeight;
  if (above !== below)
    el.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
}

// jsdom lacks checkVisibility
const visible = (el: HTMLElement) => el.checkVisibility?.() ?? true;

/** An arrow pointer, its tip at the SVG's top left (placed on the target);
 * its outline spills past the box (`overflow: visible`) */
const POINTER_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M0 0l17 10.5-7.4 1.4L6 19z" /></svg>';

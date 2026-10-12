import styles from './autorun.module.css';
import type { Stage } from './player';
import type { Scope } from './script';
import { prefersReducedMotion, springEasing, springs } from '../../../motion';
import { revealIn } from '../store/dom';

/** Acts on one playground's DOM as a reader would, with untrusted events
 * (so the yield listeners in ./useAutoRun.ts tell them from the reader's) and
 * never `focus()`, which would take the page's focus from the reader.
 *
 * The pointer lives in a layer appended to `root`, removed by `end()`.
 */
export function createStage(
  root: HTMLElement,
  store: (open: boolean) => void,
): Stage {
  const layer = document.createElement('div');
  layer.className = styles.layer;
  root.append(layer);
  let pointer: HTMLElement | undefined;
  let at = { x: 0, y: 0 };

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
      revealIn(root, el);
      const box = el.getBoundingClientRect();
      const origin = layer.getBoundingClientRect();
      at = {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      };
      const transform = `translate(${at.x - origin.left}px, ${at.y - origin.top}px)`;
      const first = !pointer;
      if (!pointer) {
        pointer = document.createElement('div');
        pointer.className = styles.pointer;
        pointer.innerHTML = POINTER_SVG;
        layer.append(pointer);
      }
      pointer.style.transform = transform;
      // the first point fades in where it is, then glides from there
      if (first) {
        void pointer.offsetWidth;
        pointer.dataset.shown = '';
      }
    },

    click(el) {
      // no Web Animations (e.g. jsdom): no ring
      if (typeof pointer?.animate === 'function' && !prefersReducedMotion())
        pointer.animate(PRESS, PRESS_TIMING);
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

    store,

    end() {
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

// jsdom lacks checkVisibility
const visible = (el: HTMLElement) => el.checkVisibility?.() ?? true;

/** An arrow pointer, its tip at the element's top left (the point) */
const POINTER_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 2l17 10.5-7.4 1.4L9 21z" /></svg>';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createPlayer } from './player';
import type { AutoRunScript } from './script';
import { createStage } from './stage';
import { prefersReducedMotion } from '../../../motion';

/** Plays `script` in the playground (`[data-playground]`) around the
 * preview `watch` is the ref of, the first time that preview is mostly in
 * view, and again from a fresh store with `replay()`.
 *
 * - The reader's own input anywhere in the playground (a press, a tap, a
 *   key) ends the run, and they carry on from what it left. Scrolling,
 *   hovering and the demo's own controls (`data-autorun-control`) don't.
 * - Out of view or in a background tab, the run pauses where it is.
 * - Under reduced motion it never starts by itself.
 *
 * `showStore` opens or closes the Store for the demo without saving it as
 * the reader's choice.
 */
export function useAutoRun(
  script: AutoRunScript | undefined,
  reset: () => void,
  showStore: (open: boolean | null) => void,
) {
  const [player] = useState(createPlayer);
  // read when a run starts, so `watch` and `replay` keep their identity
  const latest = useRef({ script, showStore });
  latest.current = { script, showStore };
  const root = useRef<HTMLElement | null>(null);

  const start = useCallback(() => {
    const { script, showStore } = latest.current;
    if (script && root.current)
      player.play(script, createStage(root.current, showStore));
  }, [player]);

  useEffect(() => player.stop, [player]);

  /** Ref for the preview: whether it's in view starts and pauses the demo.
   * The preview remounts on reset; the player (and its run) outlives it. */
  const watch = useCallback(
    (el: HTMLElement | null) => {
      const playground = el?.closest<HTMLElement>('[data-playground]');
      if (!el || !playground || !latest.current.script) return;
      root.current = playground;
      let inView = false;
      const syncPaused = () => player.setPaused(!inView || document.hidden);

      const onInput = (event: Event) => {
        if (!event.isTrusted) return;
        // a touch may start a scroll, which isn't taking over; a tap clicks
        // (a click is a PointerEvent too, so check the type)
        if (
          event.type === 'pointerdown' &&
          (event as PointerEvent).pointerType === 'touch'
        )
          return;
        if ((event.target as Element).closest?.('[data-autorun-control]'))
          return;
        player.stop();
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.intersectionRatio >= IN_VIEW;
          syncPaused();
          if (inView && player.getState() === 'idle' && !prefersReducedMotion())
            start();
        },
        { threshold: IN_VIEW },
      );
      observer.observe(el);
      for (const type of INPUT)
        playground.addEventListener(type, onInput, true);
      document.addEventListener('visibilitychange', syncPaused);
      return () => {
        observer.disconnect();
        for (const type of INPUT)
          playground.removeEventListener(type, onInput, true);
        document.removeEventListener('visibilitychange', syncPaused);
      };
    },
    [player, start],
  );

  const replay = useCallback(() => {
    const { script, showStore } = latest.current;
    player.stop();
    reset();
    // the demo shows the Store opening, if it does
    if (script?.some(step => 'store' in step)) showStore(false);
    start();
  }, [player, reset, start]);

  return { player, watch, replay };
}

// keydown misses some virtual keyboards and IMEs; beforeinput doesn't
const INPUT = ['pointerdown', 'click', 'keydown', 'beforeinput'] as const;
/** How much of the preview shows before it counts as in view */
const IN_VIEW = 0.6;

import { useCallback, useEffect, useRef, useState } from 'react';

import { createPlayer } from './player';
import type { AutoRunScript } from './script';
import { createStage } from './stage';

/** Plays `script` in the playground `root` the first time its preview is
 * mostly in view, and again from a fresh store with `replay()`.
 *
 * - The reader's own input anywhere in the playground (a press, a tap, a
 *   key) ends the run, and they carry on from what it left. Scrolling,
 *   hovering and the demo's own controls (`data-autorun-control`) don't.
 * - Out of view or in a background tab, the run pauses where it is.
 * - Under reduced motion it never starts by itself.
 *
 * `showStore` opens or closes the Store for the demo without saving it as
 * the reader's choice (`null` gives it back).
 */
export function useAutoRun(
  script: AutoRunScript | undefined,
  root: HTMLElement | null,
  reset: () => void,
  showStore: (open: boolean | null) => void,
) {
  const [player] = useState(createPlayer);
  // read when a run starts, so `watch` and `replay` keep their identity
  const latest = useRef({ script, root, showStore });
  latest.current = { script, root, showStore };
  const seen = useRef({ inView: false, touched: false });

  const start = useCallback(() => {
    const { script, root, showStore } = latest.current;
    if (!script || !root) return;
    player.play(script, createStage(root, showStore));
  }, [player]);

  useEffect(() => {
    if (!root || !script) return;
    const onInput = (event: Event) => {
      if (!event.isTrusted) return;
      // a touch may start a scroll, which isn't taking over; a tap clicks
      // (a click is a PointerEvent too, so check the type)
      if (
        event.type === 'pointerdown' &&
        (event as PointerEvent).pointerType === 'touch'
      )
        return;
      if ((event.target as Element).closest?.('[data-autorun-control]')) return;
      seen.current.touched = true;
      player.stop();
    };
    const onVisibility = () =>
      player.setPaused(!seen.current.inView || document.hidden);
    for (const type of INPUT) root.addEventListener(type, onInput, true);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      for (const type of INPUT) root.removeEventListener(type, onInput, true);
      document.removeEventListener('visibilitychange', onVisibility);
      player.stop();
    };
  }, [root, script, player]);

  /** Ref for the preview: whether it's in view starts and pauses the demo */
  const watch = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !latest.current.script) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          const state = seen.current;
          state.inView = entry.isIntersecting;
          player.setPaused(!state.inView || document.hidden);
          if (
            state.inView &&
            player.getState() === 'idle' &&
            !state.touched &&
            !matchMedia('(prefers-reduced-motion: reduce)').matches
          )
            start();
        },
        { threshold: IN_VIEW },
      );
      observer.observe(el);
      return () => observer.disconnect();
    },
    [player, start],
  );

  const replay = useCallback(() => {
    const { script, showStore } = latest.current;
    player.stop();
    reset();
    if (script?.some(step => 'store' in step)) showStore(false);
    start();
  }, [player, reset, start]);

  return { player, watch, replay };
}

// keydown misses some virtual keyboards and IMEs; beforeinput doesn't
const INPUT = ['pointerdown', 'click', 'keydown', 'beforeinput'] as const;
/** How much of the preview shows before it counts as in view */
const IN_VIEW = 0.6;

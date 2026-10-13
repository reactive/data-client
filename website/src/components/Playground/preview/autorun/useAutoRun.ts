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
  showStore: (open: boolean) => void,
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

  // ends a run with the preview; an idle player stays idle
  useEffect(() => player.stop, [player]);

  /** Ref for the preview: whether it's in view starts and pauses the demo.
   * The preview remounts on reset; the player (and its run) outlives it. */
  const watch = useCallback(
    (el: HTMLElement | null) => {
      const playground = el?.closest<HTMLElement>('[data-playground]');
      if (!el || !playground || !latest.current.script) return;
      root.current = playground;
      let visible = false;
      const syncPaused = () => player.setPaused(!visible || document.hidden);

      const onInput = (event: Event) => {
        if (!isReaderInput(event)) return;
        if (latest.current.script) played.add(latest.current.script);
        player.stop();
      };
      const observer = new IntersectionObserver(
        entries => {
          const { script } = latest.current;
          // a late callback may hold several: in order, the latest wins
          for (const entry of entries) {
            // a run pauses only once the playground is out of sight
            // entirely: it acts in the Store too, which on a phone opens
            // above the preview
            if (entry.target === playground) {
              visible = entry.isIntersecting;
              syncPaused();
              continue;
            }
            // idle: never over a run, even if the script changed identity;
            // played: a script starts by itself once per page load
            if (
              script &&
              player.getState() === 'idle' &&
              !played.has(script) &&
              mostlyShown(entry) &&
              !prefersReducedMotion()
            ) {
              played.add(script);
              start();
            }
          }
        },
        { threshold: THRESHOLDS },
      );
      observer.observe(playground);
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
    // the reader chose when to watch it, so it won't start by itself later
    if (script) played.add(script);
    // start() takes over from a run in progress: playing aborts it
    reset();
    // the demo shows the Store opening, if it does
    if (script?.some(step => 'store' in step && step.store === 'open'))
      showStore(false);
    start();
  }, [reset, start]);

  return { player, watch, replay };
}

/** Scripts that played by themselves, or that the reader took over or
 * replayed: the preview unmounts while hidden (a Demo's other protocol tab
 * shares its script), and showing it again shouldn't start the demo over.
 * Per page load (client-side navigation keeps it); replaying is the label's
 * job. */
const played = new WeakSet<AutoRunScript>();

/** The reader's own press, tap or key, which takes over: not the demo's
 * (untrusted) events or controls, and not a touch, which may start a scroll
 * (a tap still clicks; a click is a PointerEvent too, so check the type) */
export const isReaderInput = (event: Event) =>
  event.isTrusted &&
  !(
    event.type === 'pointerdown' &&
    (event as PointerEvent).pointerType === 'touch'
  ) &&
  !(event.target as Element | null)?.closest?.('[data-autorun-control]');

// keydown misses some virtual keyboards and IMEs; beforeinput doesn't
const INPUT = ['pointerdown', 'click', 'keydown', 'beforeinput'] as const;
/** Enough of the preview shows to start the demo by itself: 60% of it,
 * or of the viewport when it's taller than that */
const mostlyShown = ({
  intersectionRatio,
  intersectionRect,
  rootBounds,
}: IntersectionObserverEntry) =>
  intersectionRatio >= MOSTLY ||
  (!!rootBounds && intersectionRect.height >= rootBounds.height * MOSTLY);
const MOSTLY = 0.6;
// every 5%: a preview up to 8 viewports tall crosses one while 60% of the
// viewport shows (a tall one never reaches MOSTLY of itself)
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

import type * as Monaco from 'monaco-editor';
import { useCallback, useRef, useState } from 'react';

import { hasLayoutWidth } from './useAutoHeight';
import { holdIdle } from './whenIdle';
import { whenPainted } from './whenPainted';
import { prefersReducedMotion, springEasing, springs } from '../../motion';

/**
 * The code as the page first drew it, kept over Monaco until each of
 * `editors` shows the same (laid out and highlighted, see whenPainted), then
 * faded out; at once when the reader focuses, presses a key in or clicks
 * one (not on autoFocus alone, which would show it unhighlighted). Render
 * the cover while `covered`, with `coverRef`, and call `revealWhenPainted`
 * from the editor's onMount.
 */
export default function useEditorCover() {
  const [covered, setCovered] = useState(true);
  const coverRef = useRef<HTMLDivElement>(null);
  const revealWhenPainted = useCallback(
    (
      editors: Monaco.editor.ICodeEditor[],
      /** holds off the paint wait until it calls `start` */
      after: (start: () => void) => void = start => start(),
    ) => {
      // deferred work (whenIdle) waits for the shown editors' first paint;
      // a hidden one (no width yet) waits for that work, so doesn't hold it
      const release = editors.some(hasLayoutWidth) ? holdIdle() : undefined;
      let ended = false;
      let stops: (() => void)[] = [];
      function end() {
        release?.();
        ended = true;
        stops.forEach(stop => stop());
        interactions.forEach(interaction => interaction.dispose());
      }
      function reveal() {
        end();
        fadeOut(coverRef.current, () => setCovered(false));
      }
      // the reader using any pane shows the editor, whatever is pending: an
      // autoFocused one has focus already, so its keys and clicks count too
      const interactions = editors.flatMap(editor => [
        editor.onDidFocusEditorText(reveal),
        editor.onKeyDown(reveal),
        editor.onMouseDown(reveal),
      ]);
      editors.forEach(editor => editor.onDidDispose(end));
      after(() => {
        if (ended) return;
        let waiting = editors.length;
        stops = editors.map(editor =>
          whenPainted(editor, () => {
            waiting -= 1;
            if (!waiting) reveal();
          }),
        );
      });
    },
    [],
  );
  return { covered, coverRef, revealWhenPainted };
}

/** Fades `el` out, then calls `done` (at once under reduced motion) */
function fadeOut(el: HTMLElement | null, done: () => void) {
  if (!el?.animate || prefersReducedMotion()) return done();
  // held at 0 until React removes it, or it shows again for a frame
  el.animate(
    { opacity: [1, 0] },
    { ...springEasing(springs.snappy), fill: 'forwards' },
  ).finished.then(done, done);
}

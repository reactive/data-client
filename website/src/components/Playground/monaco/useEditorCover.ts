import type * as Monaco from 'monaco-editor';
import { useCallback, useRef, useState } from 'react';

import { whenPainted } from './whenPainted';
import { prefersReducedMotion, springEasing, springs } from '../../motion';

/**
 * The code as the page first drew it, kept over Monaco until each of
 * `editors` shows the same (laid out and highlighted, see whenPainted), then
 * faded out; at once when one gains focus. Render the cover while `covered`,
 * with `coverRef`, and call `revealWhenPainted` from the editor's onMount,
 * with `waitFor` to start the paint wait later (it calls `start`).
 */
export default function useEditorCover() {
  const [covered, setCovered] = useState(true);
  const coverRef = useRef<HTMLDivElement>(null);
  const revealWhenPainted = useCallback(
    (
      editors: Monaco.editor.ICodeEditor[],
      waitFor: (start: () => void) => void = start => start(),
    ) => {
      let ended = false;
      let stops: (() => void)[] = [];
      const end = () => {
        ended = true;
        stops.forEach(stop => stop());
        focuses.forEach(focus => focus.dispose());
      };
      const reveal = () => {
        if (ended) return;
        end();
        fadeOut(coverRef.current, () => setCovered(false));
      };
      // a click on any pane shows the editor, whatever is still pending
      const focuses = editors.map(editor =>
        editor.onDidFocusEditorText(reveal),
      );
      editors.forEach(editor => editor.onDidDispose(end));
      waitFor(() => {
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

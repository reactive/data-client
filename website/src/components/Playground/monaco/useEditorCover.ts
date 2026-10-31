import type * as Monaco from 'monaco-editor';
import { useCallback, useRef, useState } from 'react';

import { whenPainted } from './whenPainted';
import { prefersReducedMotion, springEasing, springs } from '../../motion';

/**
 * The code as the page first drew it, kept over Monaco until each of
 * `editors` shows the same (laid out and highlighted, see whenPainted), then
 * faded out; at once when one gains focus. Render the cover while `covered`,
 * with `coverRef`, and call `cover` from the editor's onMount.
 */
export default function useEditorCover() {
  const [covered, setCovered] = useState(true);
  const coverRef = useRef<HTMLDivElement>(null);
  const cover = useCallback((editors: Monaco.editor.ICodeEditor[]) => {
    let waiting = editors.length;
    const done = (all = false) => {
      if (waiting <= 0 || (!all && --waiting)) return;
      waiting = 0;
      fadeOut(coverRef.current, () => setCovered(false));
    };
    for (const editor of editors) {
      editor.onDidDispose(whenPainted(editor, done));
      // a click on any pane shows the editor
      editor.onDidFocusEditorText(() => done(true));
    }
  }, []);
  return { covered, coverRef, cover };
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

import type * as Monaco from 'monaco-editor';
import { useCallback, useRef, useState } from 'react';

import { hasLayoutWidth } from './layout';
import { whenIdle } from './whenIdle';

/**
 * Lets an editor mounted hidden lay out and highlight before it shows: render
 * its box with `.tabHidden` (out of sight, at the shown file's width) while
 * `outOfSight`. That starts once the page is idle (whenIdle) and ends when
 * the editor has painted. Call `handleMount` from its onMount and
 * `handlePainted` once it has painted.
 */
export default function useLayoutOutOfSight() {
  const [outOfSight, setOutOfSight] = useState(false);
  const cancelIdle = useRef<() => void>(undefined);
  const handleMount = useCallback((editor: Monaco.editor.ICodeEditor) => {
    // shown, it paints where it is
    if (hasLayoutWidth(editor)) return;
    cancelIdle.current = whenIdle(() => setOutOfSight(true));
    editor.onDidDispose(cancelIdle.current);
  }, []);
  const handlePainted = useCallback(() => {
    // shown before the page was idle, it painted where it is
    cancelIdle.current?.();
    setOutOfSight(false);
  }, []);
  return { outOfSight, handleMount, handlePainted };
}

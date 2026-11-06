import type * as Monaco from 'monaco-editor';
import { useCallback, useState } from 'react';

import { hasLayoutWidth } from './layout';
import { whenIdle } from './whenIdle';
import { whenPainted } from './whenPainted';

/**
 * Lets an editor mounted hidden lay out and highlight before it shows.
 * Monaco can't lay out under display:none, so while `outOfSight` its box
 * should be out of sight but at the shown file's width; it then shows at
 * once, kept as it was (./layout's layoutWhileShown). That starts once the
 * page is idle and the shown editors have painted (whenIdle, which
 * useEditorCover holds), or it would hold them up; it ends when it has
 * painted. Call `handleMount` from the editor's onMount.
 */
export default function useLayoutOutOfSight() {
  const [outOfSight, setOutOfSight] = useState(false);
  const handleMount = useCallback((editor: Monaco.editor.ICodeEditor) => {
    // shown, it paints where it is
    if (hasLayoutWidth(editor)) return;
    const cancelIdle = whenIdle(() => setOutOfSight(true));
    const stopPainted = whenPainted(editor, () => {
      cancelIdle();
      setOutOfSight(false);
    });
    editor.onDidDispose(() => {
      cancelIdle();
      stopPainted();
    });
  }, []);
  return { outOfSight, handleMount };
}

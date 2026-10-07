import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useState } from 'react';

import { prefersReducedMotion } from '../../motion/reducedMotion';

interface OpenRequest {
  editor: Monaco.editor.ICodeEditor;
  target?: Monaco.IRange | Monaco.IPosition;
}

/**
 * Lands cross-file go to definition in this editor. Opening only asks for
 * this editor's tab (`onOpen`); the selection and focus wait until the tab
 * is visible, since a display:none editor can't take focus.
 */
export default function useDefinitionOpener({
  isVisible,
  onOpen,
}: {
  isVisible: boolean;
  /** Show this editor's tab. Read once at mount, so it must be stable. */
  onOpen: () => void;
}) {
  const [request, setRequest] = useState<OpenRequest | null>(null);

  useEffect(() => {
    if (!request || !isVisible) return;
    // Wait a frame so display:none → block layout has applied
    const id = requestAnimationFrame(() => {
      const { editor, target } = request;
      // automaticLayout hasn't measured the just-shown tab yet
      editor.layout();
      if (target && 'startLineNumber' in target) editor.setSelection(target);
      else if (target) editor.setPosition(target);
      editor.focus();
      revealCursorOnPage(editor);
      setRequest(null);
    });
    return () => cancelAnimationFrame(id);
  }, [request, isVisible]);

  return useCallback(
    (editor: Monaco.editor.ICodeEditor, monaco: typeof Monaco) => {
      const opener = monaco.editor.registerEditorOpener({
        openCodeEditor(_source, resource, target) {
          if (resource.toString() !== editor.getModel()?.uri.toString())
            return false;
          onOpen();
          setRequest({ editor, target });
          return true;
        },
      });
      editor.onDidDispose(() => opener.dispose());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

/**
 * Playground editors grow to fit their content, so the page scrolls rather
 * than the editor; center the cursor line in the window when it's offscreen.
 */
function revealCursorOnPage(editor: Monaco.editor.ICodeEditor) {
  const position = editor.getPosition();
  const cursor = position && editor.getScrolledVisiblePosition(position);
  const node = editor.getDomNode();
  if (!cursor || !node) return;
  const top = node.getBoundingClientRect().top + cursor.top;
  if (top >= 0 && top + cursor.height <= window.innerHeight) return;
  window.scrollBy({
    top: top - window.innerHeight / 2,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

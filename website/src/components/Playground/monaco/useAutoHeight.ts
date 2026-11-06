import { type MonacoDiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';

import { hasLayoutWidth, layoutWhileShown } from './layout';

function isDiffEditor(
  editor: Monaco.editor.ICodeEditor | MonacoDiffEditor,
): editor is MonacoDiffEditor {
  return 'getOriginalEditor' in editor && 'getModifiedEditor' in editor;
}

/**
 * The editor's height, fit to its content as it lays out: give it to
 * @monaco-editor/react's `height` and call `handleMount` from `onMount`. It
 * also lays the editor out as its box resizes (./layout's layoutWhileShown).
 */
export default function useAutoHeight({
  initialContentHeight,
  // DiffEditor's first paint leaves the same space (--diff-gutter)
  containerGutter = 10,
}: {
  /** Estimate (line count × line height) shown until Monaco measures itself */
  initialContentHeight: number;
  containerGutter?: number;
}) {
  const [height, setHeight] = useState(initialContentHeight + containerGutter);

  const disposablesRef = useRef<{ dispose(): void }[]>([]);
  useEffect(() => () => disposablesRef.current.forEach(d => d.dispose()), []);

  const handleMount = useCallback(
    (editor: Monaco.editor.ICodeEditor | MonacoDiffEditor) => {
      const editors =
        isDiffEditor(editor) ?
          [editor.getOriginalEditor(), editor.getModifiedEditor()]
        : [editor];
      // modified (or sole) editor is the one users interact with
      const primary = editors[editors.length - 1];

      const updateHeight = () => {
        if (!hasLayoutWidth(primary)) return;

        setHeight(
          Math.max(...editors.map(e => e.getContentHeight())) + containerGutter,
        );
      };

      updateHeight();

      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = [
        ...editors.map(e => e.onDidContentSizeChange(updateHeight)),
        layoutWhileShown(editor),
      ];
    },
    [containerGutter],
  );

  return { height, handleMount };
}

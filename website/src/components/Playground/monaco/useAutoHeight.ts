import { type MonacoDiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';

function isDiffEditor(
  editor: Monaco.editor.ICodeEditor | MonacoDiffEditor,
): editor is MonacoDiffEditor {
  return 'getOriginalEditor' in editor && 'getModifiedEditor' in editor;
}

export default function useAutoHeight({
  initialContentHeight,
  containerGutter = 10,
  isFocused = true,
}: {
  /** Estimate (line count × line height) shown until Monaco measures itself */
  initialContentHeight: number;
  containerGutter?: number;
  /** Re-measure when a previously hidden tab becomes visible */
  isFocused?: boolean;
}) {
  const [height, setHeight] = useState(initialContentHeight + containerGutter);

  const updateHeightRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (!isFocused || !updateHeightRef.current) return;
    // Wait a frame so display:none → block layout has applied
    const id = requestAnimationFrame(() => updateHeightRef.current?.());
    return () => cancelAnimationFrame(id);
  }, [isFocused]);

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

      updateHeightRef.current = updateHeight;
      updateHeight();

      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = editors.map(e =>
        e.onDidContentSizeChange(updateHeight),
      );
    },
    [containerGutter],
  );

  return { height, handleMount };
}

/** Whether `editor` has a real width to lay out in: hidden tabs
 * (display:none) report 0, and a crushed pane during flex transitions can be
 * nearly as bad, where word-wrap invents thousands of lines */
export function hasLayoutWidth(editor: Monaco.editor.ICodeEditor) {
  return editor.getLayoutInfo().width >= 40;
}
